# Loom pain library — builder prompt (standalone, not part of the live run)

This is the exact recipe that produced `loom_pain_library.md`. It is NOT part of the live demo sequence (the demo
reuses the pre-built library). Attach it next to the library as a handout: anyone can paste it into Claude Code
with the Potter MCP to rebuild a library of the same shape. (Exact quotes depend on what the live pages show at
scrape time; the structure, sources, theme taxonomy, and method reproduce faithfully.)

---

GOAL: produce `loom_pain_library.md`, a reusable library of GENERAL public Loom complaints, clustered into named
themes with real verbatim quotes and their sources. This is industry pain, NEVER attributed to a specific
company; in outreach it is cited as context ("teams are hitting X with Loom lately"), never as "your team said X."

STEP 1 — scrape the sources. For EACH source URL below, call `potter_extract_structured` with this exact schema:

    {
      "type": "object",
      "properties": {
        "complaints": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "quote":  { "type": "string" },
              "theme":  { "type": "string" },
              "source": { "type": "string" }
            }
          }
        }
      }
    }

  prompt hint: "Extract verbatim negative-review quotes about Loom, each with a short theme label."
  Sources (these worked; `extract` reads the full page server-side, which sidesteps the MCP truncation that kills
  inline web_scrape markdown reads):
   - https://www.g2.com/products/atlassian-loom/reviews
   - https://www.trustpilot.com/review/loom.com
   - https://demosmith.ai/blog/loom-review-2026   (aggregates G2 / Reddit / Trustpilot)
   - https://www.salesrobot.co/blogs/loom-review
  CAVEAT: Reddit is NOT scrapeable via Firecrawl (403 "we do not support this site"). G2 and Trustpilot block
  intermittently; if one fails, lean on the Demosmith aggregator, which folds the others in. Never paste a
  reddit.com URL into extract.

STEP 2 — cluster into named themes. Group the extracted quotes into 5 to 8 themes. The taxonomy these sources
produced (use as the target; drop any theme with no real quote, keep 1 to 3 verbatim quotes each, do NOT
paraphrase):
   1. Stability / crashes since the Atlassian migration  (strongest, most recent)
   2. Billing & cancellation problems
   3. Authentication / account lockouts
   4. Support got slower after the acquisition
   5. Free-plan limits / feature gatekeeping
   6. Video quality & weak editing
   7. Manual-recording burden / getting people to actually record & watch
   8. Not built for sales / CS workflows

STEP 3 — write `loom_pain_library.md` with this exact structure:
   - Header: one line stating it is general industry pain (not attributed), how to cite it, the build date, the
     list of sources scraped, and the Reddit-not-scrapeable caveat.
   - One `## <n>. <Theme name>` section per theme: the verbatim quotes as bullets, then a `Sources:` line listing
     the domains the quotes came from.
   - A closing `## Theme -> account-profile matching guide`:
       - Remote-first / async-heavy company  -> #1 stability, #7 can't get people to record/watch
       - Enterprise / large CS org           -> #2 billing, #3 lockouts, #4 support, #5 plan limits at scale
       - PLG / self-serve SaaS               -> #5 free-plan limits, #6 quality, #7 completion, #8 workflow gaps

COST: a handful of Firecrawl `extract` calls (low cost, though `extract` is pricier per call than a plain scrape).
Build it ONCE and reuse it; do not re-run it per demo.
