// Shared helpers: read API key, screenshot Loom-embed pages, build a clean white PDF.
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

export function firecrawlKey() {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY.trim();
  const env = readFileSync(join(PROJECT_ROOT, ".env"), "utf8");
  const m = env.match(/FIRECRAWL_API_KEY=(.+)/);
  if (!m) throw new Error("FIRECRAWL_API_KEY not found in .env or environment");
  return m[1].trim();
}

// Open each hit page, center the Loom player, take a clean viewport screenshot.
// Mutates hits: sets hit.screenshotFile (relative filename) on success.
export async function screenshotHits(hits, clientDir, max = 5) {
  const toShoot = hits.slice(0, max);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
  let n = 0;
  for (const hit of toShoot) {
    const page = await ctx.newPage();
    try {
      try { await page.goto(hit.pageUrl, { waitUntil: "networkidle", timeout: 45000 }); }
      catch { await page.goto(hit.pageUrl, { waitUntil: "domcontentloaded", timeout: 45000 }); }
      await page.waitForTimeout(2500);
      const iframe = page.locator('iframe[src*="loom.com"]').first();
      if (await iframe.count()) {
        await iframe.scrollIntoViewIfNeeded();
        await page.waitForTimeout(900);
      }
      const file = `evidence-${++n}.png`;
      await page.screenshot({ path: join(clientDir, file), fullPage: false });
      hit.screenshotFile = file;
    } catch (e) {
      console.log(`  screenshot failed for ${hit.pageUrl}: ${e.message}`);
    }
    await page.close();
  }
  await browser.close();
  return toShoot;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function buildHtml(meta) {
  const shot = meta.hits.filter((h) => h.screenshotFile);
  const blocks = shot.map((h, i) => {
    const img = readFileSync(join(meta.clientDir, h.screenshotFile)).toString("base64");
    const looms = h.loomUrls.map((u) => `<div class="loom">▶ ${esc(u)}</div>`).join("");
    return `<section>
      <h2>Evidence ${i + 1}</h2>
      <div class="meta"><span class="k">Help-center page</span><a href="${esc(h.pageUrl)}">${esc(h.pageUrl)}</a></div>
      <div class="meta"><span class="k">Embedded Loom</span><div>${looms}</div></div>
      <img src="data:image/png;base64,${img}" />
    </section>`;
  }).join("");
  const extra = meta.hits.length > shot.length
    ? `<p class="more">+ ${meta.hits.length - shot.length} more help-center pages embed Loom (see evidence.json).</p>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; background: #fff; margin: 0; }
    .cover { border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 22px; }
    h1 { font-size: 24px; margin: 0 0 6px; letter-spacing: -0.3px; }
    .sub { color: #555; font-size: 13px; }
    .stat { margin-top: 10px; font-size: 13px; color: #111; }
    .stat b { font-size: 15px; }
    section { page-break-inside: avoid; margin-bottom: 26px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #eee; padding-bottom: 6px; margin: 0 0 10px; }
    .meta { font-size: 12px; margin: 4px 0; display: flex; gap: 10px; }
    .k { color: #999; min-width: 120px; }
    .meta a { color: #2563eb; text-decoration: none; word-break: break-all; }
    .loom { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: #444; }
    img { width: 100%; border: 1px solid #e3e3e3; border-radius: 6px; margin-top: 10px; }
    .more { color: #777; font-size: 12px; font-style: italic; }
  </style></head><body>
    <div class="cover">
      <h1>Loom usage evidence: ${esc(meta.client)}</h1>
      <div class="sub">Help center: ${esc(meta.site)}</div>
      <div class="stat">Pages scanned <b>${meta.pagesScanned}</b> &nbsp;·&nbsp; pages embedding Loom <b>${meta.hits.length}</b> &nbsp;·&nbsp; Loom videos <b>${new Set(meta.hits.flatMap((h) => h.loomUrls.map((u) => u.split("/").pop()))).size}</b></div>
    </div>
    ${blocks}${extra}
  </body></html>`;
}

export async function buildEvidencePdf(meta) {
  const html = buildHtml(meta);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const out = join(meta.clientDir, `${meta.client}-loom-evidence.pdf`);
  await page.pdf({ path: out, format: "A4", printBackground: true });
  await browser.close();
  return out;
}
