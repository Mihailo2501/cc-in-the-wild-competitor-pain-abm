# 04 — Match the Loom pain and write the ABM playbook

Paste into Claude Code (Potter MCP). Live. Run it for both Loop and Planhat; it writes the playbook, the account
JSON, and renders the brand-themed account microsite into the sibling output folder.

---

PARALLELIZE across clients: spin up one subagent per client (Task tool), each doing A through C below for its
client and returning the file paths. Pass each subagent its client's committee + hook from Part 3. Run them in
parallel; the main session collects.

A. MATCH the pain (from `loom_pain_library.md`) to each account. Pick the 1 to 2 DOCUMENTED themes that best fit
the account's profile (use real scraped quotes, not positioning). For a heavy Loom embedder, #1 stability + #6
inconsistent quality fit well; keep the watch-rate / completion angle as the product PITCH in the DMs, not as
scraped pain. Return, per client: the matched theme(s), the strongest supporting quote (with source), and one
sentence on why it fits. Use these as INDUSTRY context, never as "your team said X."

B. WRITE `../CC in the Wild Demo Output/<client>/<client>-abm-playbook.md` with:
1. Org map: the committee from Part 3 (name, role, LinkedIn), each tagged by deal job: PRIMARY (CS owner),
   CHAMPION (the practitioner who would use the tool), ECONOMIC SPONSOR (CCO/CRO), REVENUE EXEC, OPS GATEKEEPER,
   ESCALATION-ONLY (CEO/CFO).
2. A 30-DAY, SIGNAL-DRIVEN sequence, NOT a fixed drip: connect before you DM; lead with CHAMPION + PRIMARY;
   escalate to the economic buyer ONLY on a reply or clear engagement; warm up before any DM; branch points
   throughout (if X replies do Y; if silence, value-add follow-up, do not escalate); max 2 touches per person;
   if anyone replies positively, drop the cadence and go human. Week 1 connect+warm, Week 2 open champion+primary,
   Week 3 escalate on signal, Week 4 widen + final follow-ups, Day 30 stop-or-nurture.
3. A tailored DM per committee member: open on the matched pain as INDUSTRY context (never "your team said X"),
   cite the real evidence (their help center embeds Loom, use the page URL from Part 2), pitch the CS-video
   alternative, weave the primary's hook (Part 3) for the primary only, plain text, no markdown, no em dashes.
Match the company's own term for CS (Loop = "Merchant Success", Planhat = "Deployment & Growth").

C. ACCOUNT MICROSITE. Build `../CC in the Wild Demo Output/<client>/<client>-account.json` (committee with
role/tier/order/send/photo/dm, pains, evidenceShots, sequence, an optional sequenceNote, rules; the exact data
shape is at `examples/account.example.json`). Then render the self-contained mini-site from the kit root:

    node scripts/build-account-site.js <client>

It writes `<client>-site.html` next to the JSON: one brand-themed scrolling page (hero, matched pain, evidence
proof, the buyer-committee thread-flow with signal gates, the 30-day sequence with the IF/ELSE branch, the DMs
in send order). It base64-embeds the committee photos and the evidence screenshots, so the file is fully
portable. Open it in a browser. Read-only research only, draft, do not send.

BRAND KIT: Loop and Planhat ship with hand-tuned kits inside build-account-site.js, extracted live via Potter
`potter_browser_inspect_styles`. For a NEW client, extract its kit first: `potter_browser_open` the company
site, `potter_browser_inspect_styles` on buttons / links / headings / body for color, background-color,
font-family, border-radius; map the values to OKLCH per `~/.claude/skills/html-craft/reference/tokens.md`; then
add a BRAND_KITS entry or drop a `<client>-brand.json` (same shape as a BRAND_KITS entry) in the client folder.
With no kit, the generator falls back to a clean neutral default.

QA (optional): screenshot the site, then gate it through the anti-slop detector (run `--serve` for the
full render-based check; both demo sites pass):

    node scripts/render-site.js "../CC in the Wild Demo Output/<client>/<client>-site.html" /tmp/<client>.png
    bash ~/.claude/skills/html-craft/scripts/detect.sh --serve "../CC in the Wild Demo Output/<client>/<client>-site.html"
