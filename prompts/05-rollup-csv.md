# 05 — Roll-up CSV

Paste into Claude Code. Final deliverable. Run it from the kit root to write
`../CC in the Wild Demo Output/customers.csv` from the artifacts produced in Parts 2-4, then give the recap.

---

Write `../CC in the Wild Demo Output/customers.csv` with one row per client that survived the yield filter,
columns:

    client, help_center_url, mode, pages_scanned, loom_pages, loom_videos, evidence_pdf_path,
    primary_dm_name, primary_dm_role, primary_dm_linkedin, matched_pain_themes, playbook_path

Pull pages_scanned, loom_pages (= number of hits), loom_videos (the `loomVideos` field, unique Loom videos), and
evidence_pdf_path from each `../CC in the Wild Demo Output/<client>/evidence.json`; and the committee + pain +
playbook fields from Parts 3-4. The per-client microsite is at `<client>/<client>-site.html`.
Then print a one-paragraph recap for the room: how many candidates we ran, how many had real help-center Loom
evidence (the yield), and which account is the strongest first target and why.

Reminder: nothing was sent. Every artifact is a draft the operator reviews before any outreach.
