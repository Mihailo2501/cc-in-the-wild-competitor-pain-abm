# 03 — Map the Customer Success buyer committee

Paste into Claude Code (Potter MCP). Live research, runs inline. Run it for both Loop and Planhat; the committee
it returns feeds Part 4. Writes no files itself.

> HOW THIS WORKS (mechanism): `potter_find_decision_maker` has NO LLM (Potter is stateless tools). Per call it
> fetches a FIXED pool of up to 25 employees for the company (hard internal cap of 25; num_candidates only trims
> what comes back), ranks them by token-overlap against your role string, and DROPS anything under a 0.05
> relevance floor. The role string does NOT widen the fetch; it re-ranks the same 25 and the floor hides
> non-matching titles, so different role lenses surface DIFFERENT slices of the same 25. Treat it as an
> ENUMERATOR you query from a few angles, reason over the union yourself, and ignore its score order. CEILING:
> you never see past the first 25 the actor returns, so for very large orgs the pool is only a sliver.
>
> SETUP: the harvestapi employees actor needs a one-time Apify permission approval + a Claude Code restart
> (already done). If find_decision_maker returns 0, that wore off, so use the web_search fallback.

---

PARALLELIZE across clients: spin up one subagent per surviving client (Task tool). Each subagent does everything
below for its client and returns the committee table + primary hook; the main session collects them. Run them in
parallel. Subagents inherit Potter MCP access, and within a subagent the three role-lens calls can also run in
parallel.

For each client that yielded Loom evidence in Part 2:

1. ENUMERATE the pool from a few angles. Call `potter_find_decision_maker` with `num_candidates: 25` for each of
   THREE role lenses (a fourth is redundant, it just re-surfaces the same 25):
   - "Customer Success" (the primary + CS practitioners)
   - "Chief Revenue Officer" (the exec / revenue / RevOps layer)
   - "Onboarding and customer enablement" (onboarding / enablement / implementation)
   Union and dedupe the candidates across the three calls into one pool (name, title, headline, LinkedIn).

2. REASON over the pool (this is the LLM step, not the tool's job). From the deduped pool:
   - Drop obvious noise: engineers, designers, unrelated departments, board members unless relevant, and people
     whose current employer is not the target company (the actor really does mis-attach outsiders, e.g. it tagged
     a different company's CEO onto a target at a low score, so check each headline names the target company).
   - Classify the rest into the committee: VP/Head of Customer Success (PRIMARY), CRO / Chief Customer Officer,
     Director of CS Operations, CS Enablement Lead, Head of Onboarding. Match by ACTUAL title/headline, not the
     tool's score. Note the company's own term for CS (e.g. Loop calls it "Merchant Success").
   - Pick the single most senior CS owner as the primary. If a committee role has no clear person, say "not
     found" rather than inventing one.

3. FALLBACK (only if step 1 returns 0 candidates): `potter_web_search`, e.g.
   `"<Company>" "VP of Customer Success" OR "Head of Customer Success"`. Pull names + LinkedIn from theorg.com,
   rocketreach, the company's team pages, and LinkedIn snippets. Watch for same-name companies (e.g. "Loop").

4. For the PRIMARY only:
   - `potter_research_person` to confirm name, title, current company, LinkedIn URL.
   - `potter_summarize_linkedin_posts` with `limit: 5` (larger truncates) for recent topics + one hook. If there
     are no usable posts, take the hook from the verified profile/headline, do NOT invent a quote.

Return, per client: a committee table (name, role, LinkedIn URL, one-line "why them") plus the primary's
personalization hook. Cite provider_status honestly.
