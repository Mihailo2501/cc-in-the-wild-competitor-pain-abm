// freeze.js : snapshot the current output for a client into the gitignored frozen/<client>/,
// so future runs are deterministic and free. Run it once after a live run you are happy with.
// Usage: node scripts/freeze.js loop planhat
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR =
  process.env.OUT_DIR || path.join(__dirname, "..", "..", "CC in the Wild Demo Output");
const FROZEN = path.join(__dirname, "..", "frozen");

const clients = process.argv.slice(2);
if (!clients.length) {
  console.error("usage: node scripts/freeze.js <client> [client...]");
  process.exit(1);
}

for (const c of clients) {
  const src = path.join(OUT_DIR, c);
  if (!fs.existsSync(src)) {
    console.error(`[${c}] no output at ${src}; run the live capture + site first`);
    continue;
  }
  const dst = path.join(FROZEN, c);
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(src)) {
    if (f === "evidence.json" || /\.png$/.test(f) || f === `${c}-account.json`) {
      fs.copyFileSync(path.join(src, f), path.join(dst, f));
      n++;
    }
  }
  console.log(`[${c}] froze ${n} files into frozen/${c}/ (evidence.json, screenshots, account.json)`);
}
