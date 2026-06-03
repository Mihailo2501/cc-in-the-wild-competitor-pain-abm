// render-site.js : full-page screenshot of a generated site, for visual QA.
// Forces every scroll-reveal element visible first so the whole page shows.
// Usage: node scripts/render-site.js <file.html> <out.png>
import { chromium } from "playwright";
import path from "node:path";

const file = process.argv[2];
const out = process.argv[3] || file.replace(/\.html$/, ".preview.png");
if (!file) {
  console.error("usage: node scripts/render-site.js <file.html> <out.png>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: parseInt(process.env.W || "1240", 10), height: 1200 },
  deviceScaleFactor: 1,
});
await page.goto("file://" + path.resolve(file), { waitUntil: "networkidle", timeout: 30000 });
await page.evaluate(() =>
  document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("revealed"))
);
await page.waitForTimeout(700);
const sel = process.argv[4];
if (sel) {
  const el = await page.$(sel);
  if (!el) throw new Error("selector not found: " + sel);
  await el.screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: true });
}
await browser.close();
console.log("wrote", out);
