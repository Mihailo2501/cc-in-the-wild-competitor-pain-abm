# CC in the Wild: Loom-customer ABM kit

A complete, copy-paste kit for running an account-based outbound play with Claude Code and the Potter MCP. You
detect which companies embed Loom in their own help centers, prove it with screenshots, map each company's
customer-success buying committee, and draft a multi-threaded outreach playbook plus a brand-themed one-page microsite.
Everything is read-only research and draft-only. Nothing is ever sent.

This guide takes you from zero (nothing installed) to a full run.

## 1. What you will build
Running the five prompts in order produces, for two example companies (Loop and Planhat):
- an evidence PDF: screenshots of the actual help-center pages where they embed Loom,
- a buyer-committee map of their customer-success org,
- a 30-day, signal-driven outreach sequence with a tailored DM per person,
- a one-page account microsite (HTML): the committee as a brand-themed diagram with faces, the matched pain, the
  evidence, the 30-day sequence, and the messages, in each company's own colors and fonts,
- a roll-up CSV across the accounts.

## 2. What is Potter
Potter is an open-source MCP server for Claude Code. An MCP server is a plug-in that gives Claude Code extra
tools; Potter's are for go-to-market research. You bring your own API keys (BYOK), Potter runs locally, and
nothing is proxied through a third party. It is the research engine behind this kit: finding people and companies,
discovering decision-makers, scraping and searching the web, and extracting structured data. You never call its
tools by hand; Claude Code calls them as it follows the prompts. It is MIT-licensed at
github.com/Mihailo2501/potter-mcp, published on npm as `potter-mcp`, and ships 21 tools.

## 3. Potter's tools (21 in total, so you can read the prompts)
Composite, each does a whole job in one call:
- `potter_research_person` profile + posts + current company + news, from a LinkedIn URL.
- `potter_research_company` LinkedIn page + site pages + news, from a domain or LinkedIn URL.
- `potter_find_decision_maker` likely decision-makers at a company for a given role.
- `potter_summarize_linkedin_posts` recent posts, themes, and notable quotes for a person.
- `potter_extract_structured` pull structured data from any web page against a schema you give it.

Primitives:
- `potter_linkedin_profile` / `potter_linkedin_company` / `potter_linkedin_posts` raw LinkedIn lookups.
- `potter_web_search` / `potter_web_scrape` / `potter_web_crawl` web research.
- `potter_browser_*` (open, act, click, fill, extract, screenshot, scroll, inspect_styles, close) browser automation.
- `potter_provider_status` verifies your provider keys (the one utility tool).

## 4. What you received (the kit)
| File or folder | What it is |
|---|---|
| `prompts/01-find-loom-customers.md` ... `05-rollup-csv.md` | the five prompts, paste in order |
| `scripts/capture-loom-evidence.js` | builds the evidence PDF (Firecrawl + Playwright) |
| `scripts/evidence-lib.js` | helper for the capture script (screenshots + PDF) |
| `scripts/build-account-site.js` | renders the brand-themed account microsite (HTML) |
| `scripts/render-site.js` | screenshots a microsite for QA (Playwright) |
| `scripts/md-to-pdf.js` | re-renders this guide PDF from the markdown |
| `loom_pain_library.md` | the reusable library of general Loom complaints (used in Part 4) |
| `pain-library-builder.md` | the standalone prompt that produced the library, so you can rebuild it |
| `examples/account.example.json` | the data shape the microsite builder expects |
| `package.json`, `.env.example` | dependencies and the key-file template |
| `USER-GUIDE.md` / `USER-GUIDE.pdf` | this guide: markdown source and printable PDF |

## 5. Prerequisites
- A computer with Node.js 20 or newer (check with `node -v`).
- Claude Code installed.
- API keys: an Apify token and a Firecrawl key (Firecrawl has a free tier; Apify gives ~$5 free sign-up credit).

## 6. Install, step by step

**Step 1. Install Claude Code.** See Anthropic's docs.

**Step 2. Install and connect the Potter MCP** (open source: github.com/Mihailo2501/potter-mcp, on npm as `potter-mcp`). Add it:

```
claude mcp add potter --scope user -- npx -y potter-mcp
```

Then add your provider keys: open `~/.claude.json`, find `mcpServers` > `potter`, and give it an `env` block:

```
"potter": {
  "command": "npx",
  "args": ["-y", "potter-mcp"],
  "env": {
    "POTTER_APIFY_TOKEN": "apify_api_xxx",
    "POTTER_FIRECRAWL_API_KEY": "fc-xxx"
  }
}
```

Apify and Firecrawl are all this kit needs from Potter. (Potter's browser tools also accept Browserbase keys, but this kit does not use them.) Restart Claude Code, then verify with `claude mcp list`; you should see `potter` Connected. `npx -y` auto-pulls the latest version each session, so there is no global install.

**Step 3. Install this kit's local dependencies.** Open a terminal IN the kit folder and run `npm install`. That installs Firecrawl and Playwright and downloads a headless Chromium. If Chromium did not install, run `npx playwright install chromium`.

**Step 4. Add your Firecrawl key for the local capture script.** Copy the template with `cp .env.example .env`, then edit `.env` and set `FIRECRAWL_API_KEY=` to your key. This is separate from Potter's key in Step 2: the local capture script reads this `.env`, while Potter reads `~/.claude.json`. Use the same Firecrawl key in both.

## 7. Run it (zero to a full result)
Open Claude Code IN the kit folder (so the relative paths in the prompts resolve), then go in order:
1. Paste `prompts/01-find-loom-customers.md`. Claude pulls the BuiltWith list of Loom users; you proceed with the
   two pre-vetted accounts, Loop and Planhat.
2. Paste `prompts/02-capture-loom-evidence.md`. This runs the capture script on both and writes the evidence PDFs
   to `../CC in the Wild Demo Output/<client>/`. Open them: screenshots of Loom embedded on real help pages.
3. Paste `prompts/03-map-buyer-committee.md`. Claude maps each company's customer-success committee with Potter.
4. Paste `prompts/04-match-pain-and-write.md`. Claude matches the Loom pain, writes the playbook, and builds the
   brand-themed account microsite (`<client>-site.html`) into `../CC in the Wild Demo Output/<client>/`. Open it
   in a browser.
5. Paste `prompts/05-rollup-csv.md`. Claude writes `../CC in the Wild Demo Output/customers.csv` and gives a recap.

Everything lands in `../CC in the Wild Demo Output/`, a folder NEXT TO the kit (not inside it), created on the
first run. It is separate on purpose: delete that whole folder any time to re-run cleanly, and the kit itself
stays pristine for handoff.

Parallelism (best practice): where a step repeats per client (02 capture, 03 committee, 04 match and write), fan
out one subagent per client with the Task tool and run them in parallel; the main session synthesizes. Cap
Firecrawl-heavy work at about 3 concurrent.

## 8. The pain library
`loom_pain_library.md` ships pre-built and is reused in Part 4. It is general industry pain (real complaints from
review sites), never attributed to a specific company. To rebuild it from scratch, paste `pain-library-builder.md`
into Claude Code; that is the exact recipe (sources, extraction schema, themes). Rebuilding is optional and costs
a few Firecrawl credits, so reuse the included library unless you want fresh data.

## 9. Make it your own
This kit targets Loom, but the pattern is general: pick a tool your prospects embed, point Part 1 at that tool's
BuiltWith list, point the capture script at that tool's embed URL pattern, and swap the pain library. The
committee mapping, outreach, and dashboard steps stay the same.

## 10. Costs and safety
- Firecrawl credits: Part 1 (one extract) and Part 2 (map + scrape per company). Apify credits: Part 3 (committee
  lookups; the default actor runs on Apify's free sign-up credit). All modest for two accounts.
- Read-only and draft-only throughout. The kit never sends a message, connects to anyone, or writes to a CRM.
  Every artifact is a draft you review before any outreach.
