# CC in the Wild: Loom-customer ABM kit

A copy-paste kit for running an account-based outbound play with [Claude Code](https://claude.com/claude-code) and the [Potter MCP](https://github.com/Mihailo2501/potter-mcp). You detect which companies embed Loom in their own help centers, prove it with screenshots, map each company's customer-success buying committee, and draft a multi-threaded outreach playbook plus a brand-themed one-page microsite per account. Everything is read-only research and draft-only. Nothing is ever sent.

## What you build

Running the five prompts in order produces, for two example companies (Loop and Planhat):

- an **evidence PDF**: screenshots of the actual help-center pages where they embed Loom,
- a **buyer-committee map** of their customer-success org,
- a **30-day, signal-driven outreach sequence** with a tailored DM per person,
- a **brand-themed one-page microsite** (HTML): the committee as a diagram with faces, the matched pain, the evidence, the sequence, and the messages, in each company's own colors and fonts,
- a **roll-up CSV** across the accounts.

## Quick start

1. Install Claude Code and add the Potter MCP with your Apify + Firecrawl keys:
   `claude mcp add potter --scope user -- npx -y potter-mcp`
2. In this folder run `npm install` (installs Firecrawl + Playwright; a headless Chromium installs automatically).
3. `cp .env.example .env` and set your `FIRECRAWL_API_KEY`.
4. Open Claude Code in this folder and paste `prompts/01` through `05` in order.

Output lands in a sibling folder, `../CC in the Wild Demo Output/`, which you can delete and re-run any time.

Full zero-to-one walkthrough: **[USER-GUIDE.md](USER-GUIDE.md)** (also provided as `USER-GUIDE.pdf`).

## What is Potter

[Potter](https://github.com/Mihailo2501/potter-mcp) is an open-source MCP server for Claude Code: bring your own keys, it runs locally, nothing is proxied. It is the research engine behind this kit (finding people and companies, discovering decision-makers, scraping and searching the web, extracting structured data). You never call its tools by hand; Claude Code calls them as it follows the prompts.

## Make it your own

The pattern is general: pick a tool your prospects embed, point Part 1 at that tool's BuiltWith list, point the capture script at that tool's embed URL pattern, and swap the pain library. The committee mapping, outreach, and site steps stay the same.

## Safety

Read-only and draft-only throughout. The kit never sends a message, connects to anyone, or writes to a CRM. Every artifact is a draft you review before any outreach.
