# 02 — Capture Loom-usage evidence (the proof)

The proof step: it PRODUCES a PDF per client of the actual help-center pages with Loom embedded, a screenshot of
each Loom player. Run it from the kit root (where `npm install` was done and `.env` holds FIRECRAWL_API_KEY).

---

Run the capture for BOTH demo clients (it writes to the sibling output folder automatically):

    node scripts/capture-loom-evidence.js https://help.loopreturns.com loop
    node scripts/capture-loom-evidence.js https://help.planhat.com planhat

PARALLELIZE: run the two at once (one subagent per client, Task tool, ~100s each); cap Firecrawl at ~3 concurrent.
Map recall varies run to run; if a client comes back short or empty, re-run with `CRAWL=1` for deep recall (that is
how Loop reaches ~60 pages / ~84 videos and Planhat ~3 / ~4). "Videos" = unique Loom embeds, deduped.

Each run writes into `../CC in the Wild Demo Output/<client>/`:

    <client>-loom-evidence.pdf   (clean white deck: per hit, a screenshot centered on the embedded Loom player,
                                   the help-center page URL, and the Loom embed/share URL)
    evidence.json                (the full hit list)

That PDF is the punchline of the whole play: we did not ask Loom for anything, we PROVED which companies run it
inside their own customer onboarding. Report per client: pages scanned, pages embedding Loom, total Loom videos.

What the script does: Firecrawl `map` enumerates every help-center URL, scrapes each (cost-capped at MAX_SCAN=300)
for `loom.com/(embed|share)` in raw + rendered HTML, then Playwright screenshots the hit pages and writes the PDF
plus evidence.json. Deep-recall variant: prefix `CRAWL=1` to follow links (how Otterly went from 0 via map to
14 pages / 46 videos via crawl).

The yield-filter story to tell: across the candidates you run, only some actually embed Loom in their help center;
those are the ones worth pursuing.
