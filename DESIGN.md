# Design System — Patient Activity Calculator (The Cranial Doc)

> "Clinical Instrument." A free in-browser practice-retention calculator that
> feels like serious measurement software, not a giveaway widget. Distinct-but-
> related sub-brand of The Cranial Doc (sister to cvai-tools / the Baby Head
> Shape Calculator). Same family bones, colder skin.
>
> **Memorable thing (governs every decision):** *"This is serious software."*

## Product Context
- **What this is:** Free, client-side tool. A chiropractor uploads two monthly
  adjustment-export CSVs and gets active / inactive / churn / new-conversion /
  net-momentum stats plus one-click CSV downloads. All processing in-browser;
  no patient data is transmitted.
- **Who it's for:** Chiropractors and practice owners/managers tracking patient
  retention month over month. Broader audience than cvai-tools' pediatric DCs.
- **Space/industry:** Chiropractic practice analytics / retention.
- **Project type:** Single-page web tool (Vite + TypeScript), deploying to
  `churn.thecranialdoc.com` via Cloudflare Pages.
- **Funnel role:** Calibrated top-of-funnel. Email list + podcast are the
  primary CTAs; Foundations course gets one soft touch. Email capture is a
  link-out to a dedicated capture page (never an on-page form) so the
  "nothing leaves your browser" promise stays literally true.

## Aesthetic Direction
- **Direction:** Industrial / utilitarian-refined — a precision measurement
  instrument. Near-monochrome, high-contrast, data-forward.
- **Decoration level:** Minimal. Type, data, and one accent do the work. An
  optional faint measurement-tick motif is the only permitted ornament.
- **Mood:** Calm, exact, trustworthy. Restraint reads as confidence. The page
  should feel like a readout you'd trust with a clinical decision.
- **Family tie:** Inherits The Cranial Doc display font (ITC Avant Garde
  Gothic), DM Sans body, and the cvai-tools spacing + radii scales. Departs
  from cvai's soft sage palette toward cold graphite + clinical teal.
- **Approved visual direction:** Variant A (light bezel base) with Variant C's
  three-column side-by-side export layout grafted in. Mockups + board:
  `~/.gstack/projects/getabsolutehealth-patient-activity-calculator/designs/design-system-20260606/`

## Typography
- **Display / wordmark / section labels:** **ITC Avant Garde Gothic Book** —
  geometric, distinctive, ties to the Cranial Doc family. Used for the hero
  title, the `THE CRANIAL DOC` wordmark, and uppercase section/eyebrow labels.
- **Body / UI / buttons / patient names:** **DM Sans** (400 / 500 / 700, normal
  + italic) — the cvai-tools body font. System stack fallback while @font-face
  loads.
- **Data / numerals — the signature move:** **JetBrains Mono** for every numeric
  readout: the big stat values, churn %, patient counts, and list index numbers.
  Tabular by nature; sells the "instrument readout" feel and differentiates from
  every soft chiro tool *and* from cvai-tools. (Patient *names* stay DM Sans.)
- **Loading:** Self-hosted only (CSP self). DM Sans via @fontsource, JetBrains
  Mono via @fontsource, ITC Avant Garde Book as a bundled OTF @font-face — same
  pattern as cvai-tools. No third-party font CDN.
- **Scale (1.25 modular, 16px root — inherited from cvai-tools):**
  - xs 0.75rem (12) — captions, tool credit, list index
  - sm 0.875rem (14) — small labels, footer
  - base 1rem (16) — body
  - lg 1.125rem (18) — sub-heads, lead-in
  - xl 1.5rem (24) — section headers
  - 2xl 2rem (32) — secondary stat values
  - stat 2.4–2.6rem — supporting stat readouts (JetBrains Mono, tabular-nums)
  - stat-hero 3.5rem (56) — the ONE hero stat: Net Momentum (JetBrains Mono,
    tabular-nums, colored --pos/--neg). The supporting row (Active, Inactive,
    Churn, New) uses the smaller `stat` size beneath it.
  - 3xl 2.5rem (40) — hero title (mobile)
  - 4xl 3rem (48) — hero title (desktop)

## Color
- **Approach:** Restrained. Cold near-monochrome + one teal accent + muted
  semantic stat colors. Color is rare and meaningful.
- **Ink / graphite (cool, not pure black — prints clean, easier on eyes):**
  - `--ink-900 #11151b` — primary text, header + footer bezel bands
  - `--ink-700 #2b333d` — secondary text
  - `--ink-500 #5b6670` — muted labels, captions
  - `--ink-300 #aab3bd` — disabled, faint list index
- **Surfaces & borders (cool):**
  - `--surface #f4f6f8` — page background
  - `--white #ffffff` — cards, panels
  - `--border #e3e8ec` — cool hairlines
- **Accent (single, decisive):**
  - `--accent #0f766e` — deep clinical teal. Links, focus rings, active upload
    state, the wordmark mark. NOT cvai's soft sage.
  - `--accent-50 #e6f2f0` — teal tint for the loaded-upload card state
- **Semantic stat colors (muted / desaturated — clinical, not candy, print-clean):**
  - `--pos  #127a5e` — active patients, momentum up (deep green)
  - `--neg  #b23b3b` — inactive patients, churn, momentum down (brick, NOT alarm-red)
  - `--warn #b07a1e` — churn rate (ochre, NOT bright amber)
  - `--info #2b6cb0` — new conversions (steel blue)
- **Primary action button:** ink-graphite (`--ink-900`) fill, white label — the
  "Run Analysis" button stays serious/dark, not teal. Hover lifts to `--accent`.
- **Dark mode:** Not required for v1 (Variant B explored full-dark and was set
  aside to keep the tool light-default and approachable). If added later: redesign
  surfaces against `--ink-900`, reduce semantic saturation ~15%.

## Spacing
- **Base unit:** 4px (inherited from cvai-tools).
- **Density:** Comfortable-leaning-compact. A data tool earns slightly more
  density than cvai's parent-facing airiness, especially in the export panels.
- **Scale:** 2xs(2) xs(4) sm(8) md(12) lg(16) xl(24) 2xl(32) 3xl(48) 4xl(64).

## Layout
- **Approach:** Grid-disciplined. This is a tool, not an editorial page.
- **Frame:** Ink-graphite **header band** (wordmark + `LOCAL ONLY` status pill)
  and **footer band** (the three CTAs) bracket the page like a hardware bezel —
  the move that makes a free one-page tool feel like a shipped product.
- **Tool flow:** Single column, max content width ~720px: hero → upload cards →
  Run Analysis → results.
- **Results hierarchy:** Net Momentum is the hero (oversized `stat-hero`,
  pos/neg color, the "is my practice growing or bleeding" signal). The other
  four (Active, Inactive, Churn, New) sit beneath as a smaller equal-weight
  supporting row. First-second-third path, not five competing equals.
- **Export panels:** Three columns side-by-side (Active / New / Inactive), each
  with a mono count, a scrollable name list with mono index numbers, a totals
  row, and an ink-outline download button. (Grafted from Variant C.)
- **Large datasets:** Each panel renders at most ~100 visible rows with a
  "showing 100 of N — download CSV for the full list" line. The CSV export
  always contains every patient (it's the source of truth). Keeps the page fast
  regardless of practice size; no virtualization dependency.
- **Responsive (mobile, ≤560px):** The three export panels stack vertically,
  each **collapsed by default** to header + mono count + download button; tap to
  expand its name list. Download stays one tap. Stat hierarchy (hero + row)
  stacks hero-first. Avoids burying stats/CTA under three long lists.
- **Border radius (inherited scale):** sm 4px, md 8px, lg 12px, xl 16px,
  pill 9999px (status pill).

## Motion
- **Approach:** Minimal-functional. Only motion that aids comprehension.
- **Signature:** one refined results-reveal (short upward fade) when analysis
  runs. Nothing decorative, no scroll choreography.
- **Easing:** enter ease-out, exit ease-in, move ease-in-out
  (`cubic-bezier(0.2,0.8,0.2,1)`).
- **Duration:** micro 80ms, short 180ms, medium 250ms.

## Interaction States
A "serious software" tool never fails silently. Every state below is a designed
feature, not a fallback.

| Surface | Loading | Empty / Zero | Error | Partial |
|---|---|---|---|---|
| **Upload card** | After file pick: card shows a brief "Reading…" with the filename, mono row-count appears when parsed. | No file: dashed card, icon, "Select CSV file" + month hint. | Inline per-card error state (red border + specific message): non-CSV → "That's not a CSV"; empty/<2 rows → "No rows we can read in this file"; no name columns found → "Couldn't find name columns — pick them below" (reveals the column pickers); FileReader failure → same inline error (never a silent hang). | One file loaded: that card shows loaded state; Run stays disabled with helper text "Add the second month to run." |

**Column pickers (per file):** First Name + Last Name (or a single Full Name
column) and an **optional Patient ID** column. Match-key precedence: Patient ID
if mapped in both files → else name-only. Patient ID (chart/MRN) is the realistic
secondary for adjustment exports — it survives name changes and, because results
dedupe by the match key, collapses a visit-level export (many rows per patient)
to unique patients. ID auto-detection is conservative (Patient ID / Chart # / MRN
only — never a generic "id"/"account" that could be a per-visit id). Changing any
mapping after results invalidates the results (per-file-slot reducer).
| **Run Analysis** | Disabled until BOTH files parse valid. On click: instant client-side calc + results reveal (short upward fade), no fake spinner. | — | If a column pick yields zero usable rows, surface inline on the offending card, do not run. | — |
| **Results / stats** | — | Zero inactive → warm line "No patients dropped off this month — 100% retention." Zero new → neutral "No new patients this month." Both files identical → gentle banner "These two files look identical — did you mean to compare different months?" | — | — |
| **Export panel** | — | Empty list → "No patients" (muted, italic), download button disabled. | — | >100 rows → "showing 100 of N — download CSV for the full list." |

## Accessibility (WCAG AA target)
- **Color is never the only signal.** Every semantic stat pairs its color with a
  text label. Semantic colors (`--pos/--neg/--warn/--info`) are used on the
  LARGE numerals only (≥3:1 passes for large text). Any small-text use takes a
  darkened variant that clears 4.5:1. `--warn #b07a1e` (~3.4:1) is large-numeral-
  only; never small body text.
- **Keyboard:** upload cards are real `<label for>`+`<input type=file>` (natively
  focusable/activatable); column `<select>`s and all buttons are in tab order;
  visible focus ring using `--accent` (`--shadow-focus`) on every interactive
  element. Run + download reachable and operable by keyboard alone.
- **Screen readers:** big mono stat values get an accessible label
  (e.g. `aria-label="Net momentum: minus 11"`); the results container is
  `aria-live="polite"` so the reveal is announced; export panels use list
  semantics; the `LOCAL ONLY` pill has descriptive text, not just color.
- **Touch targets:** ≥44px for the Run button, download buttons, collapse/expand
  toggles, and upload cards on mobile.
- **Motion:** honor `prefers-reduced-motion` — the results-reveal fade is
  disabled (instant show) when the user has reduced motion set.

## Privacy / PHI framing
- Keep the `LOCAL ONLY` status pill (header) and the privacy badge.
- Footer disclaimer line (light, honest, claims nothing unprovable): "Processing
  happens entirely in your browser; no patient data is uploaded, transmitted, or
  stored. You're responsible for files you download to your device. Not legal or
  HIPAA advice."
- **Hard invariant — no third-party runtime:** no analytics, error reporting,
  remote fonts, embedded marketing widgets, or any third-party script. The
  self-only CSP in `public/_headers` enforces it. This is what makes the privacy
  promise literally true; the funnel is link-outs only.

## Funnel Placement (design-relevant)
- **Header band:** "Join the list" email CTA (primary) + a Podcast link.
- **Hero:** tool-focused; one soft course line (eyebrow or single sentence). The
  tool is the star — no course promo card.
- **Post-results card:** email + podcast with equal billing, shown after the
  user gets value.
- **Footer band:** all three offers (email, podcast, Foundations) + privacy.
- **Email link-out target:** `thecranialdoc.com` homepage. The homepage already
  IS a capture page (first-name+email form above the fold, plus a second capture
  lower down), so no dedicated landing is needed. Podcast → the homepage podcast
  section / podcast page; course → `/training`.
- All funnel copy/URLs live in `marketing.ts` (single source of truth, mirrors
  cvai-tools). Edits are a 30-second change.

## Anti-Slop Guardrails (this project)
- No sage/mist palette (that's cvai-tools; this is the cold sub-brand).
- No bright Material-style stat colors — use the muted semantic set above.
- No purple gradients, no 3-column icon-in-circle feature grids, no
  centered-everything, no gradient CTA buttons, no system-ui as display/body.
- No on-page email form (privacy promise) — email is always a link-out.
- Numbers are ALWAYS JetBrains Mono tabular; names are ALWAYS DM Sans.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-06 | Initial design system created | /design-consultation. "Clinical Instrument" direction, distinct-but-related Cranial Doc sub-brand. Memorable thing: "serious software." Approved direction: Variant A + Variant C export layout. |
| 2026-06-06 | Design review fixes | /plan-design-review. Added: Net Momentum hero stat + supporting row; full interaction-state table (inline per-card CSV errors, warm zero states); mobile stacked-collapsed exports; large-dataset cap (100 visible + CSV); WCAG-AA accessibility section (color-never-alone, keyboard, SR, 44px, reduced-motion). Score 6→9/10. |
