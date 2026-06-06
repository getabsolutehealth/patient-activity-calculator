# TODOs — Patient Activity Calculator

## Pre-deploy (small, confirm before ship)
- [ ] **Confirm canonical funnel URLs for `marketing.ts`.**
  - Email "Join the list" → `https://thecranialdoc.com` (homepage is the capture
    page — confirmed 2026-06-06, no dedicated page needed).
  - Podcast → confirm canonical podcast URL (homepage section vs `/podcast`).
  - Foundations course → confirm `/training`.
- [ ] **Confirm ITC Avant Garde license** covers this deployment (inherited from
  cvai-tools, which ships it under the same brand — just verify before deploy).

## Deferred value-adds (from office-hours Approach C — re-scope after v1 ships)
- [ ] 3-month / trend view instead of a 2-file diff (changes input model — own design pass).
- [ ] Retention-rate-over-time.
- [ ] Branded printable PDF summary (reuse cvai-tools' pdf-generator pattern).

## Notes
- Patient-ID + DOB matching: NOT deferred — built in v1 per eng review (user: "build now, defer nothing").
- On-page email form: intentionally NOT built (privacy promise) — email is a link-out.
