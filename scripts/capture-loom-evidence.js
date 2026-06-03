// Detect Loom usage in a customer's help center / KB and package the evidence as a clean PDF.
//
// Pipeline per client:
//   1. Firecrawl map   -> enumerate every help-center URL (works on JS-rendered centers).
//   2. Firecrawl scrape -> regex rawHtml + rendered html for loom.com/(embed|share).
//   3. Playwright       -> viewport screenshot (centered on the Loom player) of the hit pages.
//   4. Write output/<client>/ : <client>-loom-evidence.pdf  +  evidence.json
//
// Usage:  node scripts/capture-loom-evidence.js <help-center-url> [clientSlug]
//         MAX_SCAN=300 MAX_SHOTS=5 node scripts/capture-loom-evidence.js https://help.loopreturns.com loop
//
// Key is read from project .env (FIRECRAWL_API_KEY) or process.env. No key hardcoded.

import { Firecrawl } from "firecrawl";
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { firecrawlKey, screenshotHits, buildEvidencePdf } from "./evidence-lib.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
// Output base: a SIBLING folder next to the kit, so runs land OUTSIDE the kit (easy to delete + re-run, and the
// kit stays clean for handoff). Override with LOOM_OUT_DIR to write somewhere else.
const OUT_BASE = process.env.LOOM_OUT_DIR || join(PROJECT_ROOT, "..", "CC in the Wild Demo Output");
const LOOM_RE = /loom\.com\/(?:embed|share)\/[A-Za-z0-9]+/g;
const CONCURRENCY = 6;
// A Loom video is identified by its id (the segment after /embed/ or /share/). embed and share point at
// the SAME video, so dedupe by id to count real videos, not url entries.
const videoId = (u) => u.split("/").pop();
const uniqueVideos = (hits) => new Set(hits.flatMap((h) => h.loomUrls.map(videoId))).size;

function normalizeUrls(mapResult) {
  const raw = mapResult.links || mapResult.urls || mapResult || [];
  const arr = Array.isArray(raw) ? raw : raw.links || [];
  return [...new Set(arr.map((l) => (typeof l === "string" ? l : l.url)).filter(Boolean))];
}

async function pooled(items, worker, concurrency = CONCURRENCY) {
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < items.length) await worker(items[i++]);
  }));
}

async function main() {
  const site = process.argv[2];
  if (!site) { console.error("usage: node scripts/capture-loom-evidence.js <help-center-url> [clientSlug]"); process.exit(1); }
  const client = (process.argv[3] || new URL(site).hostname.replace(/\./g, "-")).toLowerCase();
  const MAX_SCAN = Number(process.env.MAX_SCAN || 300);  // Firecrawl scrape ~1 credit/page
  const MAX_SHOTS = Number(process.env.MAX_SHOTS || 5);

  const clientDir = join(OUT_BASE, client);

  // Frozen-evidence short-circuit: if the kit ships pre-captured evidence for this client, use it
  // (zero Firecrawl, instant, reproducible for the demo). Set LIVE=1 to force a fresh live capture.
  const frozenDir = join(PROJECT_ROOT, "frozen", client);
  if (existsSync(join(frozenDir, "evidence.json")) && !process.env.LIVE) {
    console.log(`[${client}] FROZEN evidence (no Firecrawl; set LIVE=1 to force a fresh capture).`);
    mkdirSync(clientDir, { recursive: true });
    const frozen = JSON.parse(readFileSync(join(frozenDir, "evidence.json"), "utf8"));
    for (const f of readdirSync(frozenDir)) {
      if (f.endsWith(".png")) copyFileSync(join(frozenDir, f), join(clientDir, f));
    }
    writeFileSync(join(clientDir, "evidence.json"), JSON.stringify(frozen, null, 2));
    if (frozen.hits.some((h) => h.screenshotFile)) {
      const pdf = await buildEvidencePdf({ client, site: frozen.site, clientDir, pagesScanned: frozen.pagesScanned, hits: frozen.hits });
      console.log(`[${client}] PDF: ${pdf}`);
    }
    console.log(`[${client}] DONE (frozen) - ${frozen.hits.length} page(s), ${uniqueVideos(frozen.hits)} unique Loom video(s).`);
    return;
  }

  const fc = new Firecrawl({ apiKey: firecrawlKey() });
  mkdirSync(clientDir, { recursive: true });

  const detect = (blob) => [...new Set((blob.match(LOOM_RE) || []).map((u) => "https://www." + u))];
  const DEEP = !!process.env.CRAWL; // CRAWL=1 -> follow links (catches onboarding pages map misses), slower/costlier
  const hits = [];
  let scanned;

  if (DEEP) {
    // Deep recall: crawl follows links and scrapes in one pass. Catches pages not in map's index.
    console.log(`[${client}] crawling ${site} (deep recall, limit ${MAX_SCAN}) ...`);
    const res = await fc.crawl(site, { limit: MAX_SCAN, scrapeOptions: { formats: ["rawHtml", "html"] } });
    const data = res.data || [];
    scanned = data.length;
    for (const p of data) {
      const found = detect((p.rawHtml || "") + "\n" + (p.html || ""));
      const pageUrl = p.metadata?.sourceURL || p.metadata?.url || p.url;
      if (found.length) { hits.push({ pageUrl, loomUrls: found }); console.log(`  HIT ${pageUrl} -> ${new Set(found.map(videoId)).size} loom video(s)`); }
    }
    console.log(`[${client}] crawled ${scanned} pages; ${hits.length} embed Loom.`);
  } else {
    // Fast mode: map enumerates indexed URLs, then scrape each.
    console.log(`[${client}] mapping ${site} ...`);
    const mapped = normalizeUrls(await fc.map(site, { limit: 5000 }));
    const noAssets = mapped.filter((u) => !/\.(png|jpg|jpeg|svg|pdf|zip|css|js)(\?|$)/i.test(u));
    const priority = /\/(articles?|help|docs|guide|getting-started|onboarding|tutorial|academy|support)/i;
    const ranked = [...noAssets].sort((a, b) => (priority.test(b) ? 1 : 0) - (priority.test(a) ? 1 : 0));
    const pages = ranked.slice(0, MAX_SCAN);
    scanned = pages.length;
    console.log(`[${client}] ${noAssets.length} pages mapped; scanning ${pages.length} (cap ${MAX_SCAN}) for Loom embeds`);
    await pooled(pages, async (url) => {
      try {
        const res = await fc.scrape(url, { formats: ["rawHtml", "html"], timeout: 25000 });
        const found = detect((res.rawHtml || "") + "\n" + (res.html || ""));
        if (found.length) { hits.push({ pageUrl: url, loomUrls: found }); console.log(`  HIT ${url} -> ${new Set(found.map(videoId)).size} loom video(s)`); }
      } catch {}
    });
    console.log(`[${client}] ${hits.length} pages embed Loom.`);
  }

  if (hits.length) {
    console.log(`[${client}] screenshotting first ${Math.min(MAX_SHOTS, hits.length)}...`);
    await screenshotHits(hits, clientDir, MAX_SHOTS);
    const pdf = await buildEvidencePdf({ client, site, clientDir, pagesScanned: scanned, hits });
    console.log(`[${client}] PDF: ${pdf}`);
  }
  writeFileSync(join(clientDir, "evidence.json"), JSON.stringify({ client, site, pagesScanned: scanned, mode: DEEP ? "crawl" : "map", loomVideos: uniqueVideos(hits), hits }, null, 2));
  console.log(`[${client}] DONE - ${hits.length} page(s), ${uniqueVideos(hits)} unique Loom video(s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
