# Loom pain library (general, reusable)

General public complaints about Loom, clustered into themes. INDUSTRY pain mined from public sources — NOT
attributed to any specific target company. In outreach cite a theme as context ("teams are hitting X with Loom
lately"), never as "your team said X."

Built 2026-05-31 by scraping the actual source pages with `potter_extract_structured` (reads full page,
returns structured quotes — sidesteps the MCP truncation that blocks inline markdown reads).
Sources scraped: G2 pros/cons, Trustpilot, Demosmith 2026 review (aggregates G2/Reddit/Trustpilot), SalesRobot
review. NOTE: Reddit could not be scraped — Firecrawl returns 403 "we do not support this site" for reddit.com,
so Reddit-specific pain is only reflected indirectly via the Demosmith aggregation + search snippets.

## 1. Stability / crashes since the Atlassian migration  (strongest, most recent)
- "Users report crashes during recording, videos that fail to upload, audio that desynchronises from video, and
  a desktop app that has become noticeably slower and heavier." (Demosmith 2026)
- "It can be slow to load, especially with larger videos." / "Occasional bugs that disrupt the recording
  process." (G2)
Sources: demosmith.ai/blog/loom-review-2026, g2.com/products/atlassian-loom/reviews

## 2. Billing & cancellation problems
- "Multiple users report being charged after cancelling, difficulty reaching anyone to resolve billing disputes,
  and in some cases, accounts being sent to collection agencies for charges the user disputes." (Demosmith 2026)
Sources: demosmith.ai/blog/loom-review-2026

## 3. Authentication / account lockouts
- "Users report being locked out of their accounts, stuck in authentication loops, or unable to access their
  video libraries after changes to the login system." (Demosmith 2026)
- "Verification failed, and I had to try multiple times without success." / "The verification process is taking
  way too long!" (Trustpilot)
Sources: demosmith.ai/blog/loom-review-2026, trustpilot.com/review/loom.com

## 4. Support got slower after the acquisition
- "Several reviewers note that support response times have increased since the acquisition, and that resolving
  issues requires persistence." (Demosmith 2026)
Sources: demosmith.ai/blog/loom-review-2026

## 5. Free-plan limits / feature gatekeeping
- "The 5-minute limit and 100-video cap make the free plan a trial rather than a usable tier." (Demosmith 2026)
- "The Free Plan caps you at 25 videos and 5 minutes per recording, which becomes a real limitation fast for
  regular users." (SalesRobot)
- "A key drawback of Loom is its limitations on the free plan—recording length, storage, and some advanced
  features are restricted." (G2)
Sources: demosmith.ai/blog/loom-review-2026, salesrobot.co/blogs/loom-review, g2.com

## 6. Video quality & weak editing
- "The video quality can be inconsistent at times." / "The editing options are quite limited." (G2)
Sources: g2.com/products/atlassian-loom/reviews

## 7. Manual-recording burden / getting people to actually record & watch
- "If your goal is to produce product demos without manual recording, Loom does not solve that problem." (Demosmith)
- (Reddit r/SaaS, via search snippet — not directly scrapeable) "the biggest issue was never the videos
  themselves. It was getting customers to actually record one."
Sources: demosmith.ai/blog/loom-review-2026, reddit.com/r/SaaS (snippet only)

## 8. Not built for sales / CS workflows
- "Loom was not built for sales outreach and has no prospecting, sequencing, or lead management capabilities." /
  "You'll spend more time wrestling with workarounds than actually selling." (SalesRobot)
Sources: salesrobot.co/blogs/loom-review

---

## Theme → account-profile matching guide
- Remote-first / async-heavy company  -> #1 stability, #7 "can't get people to record/watch"
- Enterprise / large CS org           -> #2 billing, #3 lockouts, #4 support, #5 plan limits at scale
- PLG / self-serve SaaS               -> #5 free-plan limits, #6 quality, #7 completion, #8 workflow gaps
