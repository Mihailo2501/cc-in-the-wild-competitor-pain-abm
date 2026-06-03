# 01 — Find Loom's customers (the universe)

Live-optional opener. Returns a shortlist in chat; writes no files.

---

The play: a fictional Loom alternative built for the customer-success / onboarding-video use case. Our prospects
are Loom's own customers, companies that already embed Loom in their customer-facing help centers.

Show the universe: you cannot ask Loom for its customer list, so we detect it. Use Potter
`potter_extract_structured` on https://trends.builtwith.com/websitelist/Loom to pull the BuiltWith "websites
using Loom" list (it states the total, ~12,000+ companies, ~50 named domains per page, no login). Return a clean
table: domain, sales revenue, tech spend, country.

This is a safe step to run live (free, no login) as the opener. Then state the move plainly: from this universe
we proceed with two accounts we pre-vetted as heavy Loom users, LOOP and PLANHAT. We do not pick live; the demo
is staged on those two.

Why these two: Loop embeds Loom across 27 help articles / 72 videos, the heaviest in the set; Planhat is itself a
Customer Success platform that runs Loom inside its own help center (the irony hook). The Loom pain is already
documented in `loom_pain_library.md` and matched per account in Part 4.
