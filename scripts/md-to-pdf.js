// md-to-pdf.js : render a markdown file to a clean, printable PDF (the kit guide).
// Markdown -> HTML (marked, GFM) -> Playwright A4 PDF. Re-run after editing the .md.
// Usage: node scripts/md-to-pdf.js USER-GUIDE.md USER-GUIDE.pdf
import { marked } from "marked";
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const inFile = process.argv[2] || "USER-GUIDE.md";
const outFile = process.argv[3] || inFile.replace(/\.md$/, ".pdf");

const body = marked.parse(readFileSync(inFile, "utf8"), { gfm: true });

const css = `
  :root { --ink:#20212b; --muted:#585b6b; --accent:#2f6df6; --line:#e6e8ef; --code-bg:#f4f5f9; }
  * { box-sizing: border-box; }
  body { margin: 0; color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, Helvetica, Arial, sans-serif;
    font-size: 10.6pt; line-height: 1.62; -webkit-font-smoothing: antialiased; }
  main { max-width: 720px; margin: 0 auto; }
  h1, h2, h3, h4 { line-height: 1.2; break-after: avoid; }
  h1 { font-size: 23pt; font-weight: 800; letter-spacing: -0.4px; margin: 0 0 6px;
    padding-bottom: 10px; border-bottom: 2px solid var(--accent); }
  h2 { font-size: 14.5pt; font-weight: 700; margin: 26px 0 8px; letter-spacing: -0.2px; }
  h3 { font-size: 12pt; font-weight: 700; margin: 18px 0 6px; }
  h4 { font-size: 10.8pt; font-weight: 700; margin: 14px 0 4px; }
  p { margin: 0 0 10px; }
  a { color: var(--accent); text-decoration: none; word-break: break-word; }
  strong { font-weight: 700; }
  ul, ol { margin: 0 0 12px; padding-left: 22px; }
  li { margin: 4px 0; }
  li > p { margin: 0 0 6px; }
  code { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 0.9em;
    background: var(--code-bg); padding: 1.5px 5px; border-radius: 4px; color: #b5396b; word-break: break-word; }
  pre { background: #f7f8fb; border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px;
    overflow-x: auto; margin: 0 0 12px; break-inside: avoid; }
  pre code { background: none; padding: 0; color: var(--ink); font-size: 9.2pt; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 9.6pt; break-inside: avoid; }
  th { text-align: left; background: var(--code-bg); padding: 7px 10px; border-bottom: 2px solid #d6d9e6;
    font-weight: 700; }
  td { padding: 7px 10px; border-bottom: 1px solid #ededf3; vertical-align: top; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 22px 0; }
  blockquote { margin: 0 0 12px; padding-left: 14px; border-left: 3px solid var(--accent); color: var(--muted); }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><main>${body}</main></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.body.offsetHeight); // force a layout pass
await page.waitForTimeout(200);
await page.pdf({
  path: outFile,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "16mm", left: "15mm", right: "15mm" },
});
await browser.close();
console.log("wrote", resolve(outFile));
