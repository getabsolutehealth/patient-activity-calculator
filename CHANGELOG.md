# Changelog

## 2.0.0-pre — 2026-06-06

Full rebuild of the Patient Activity Calculator from a single `index.html` into a
Vite + TypeScript app — a sister tool to cvai-tools, wearing The Cranial Doc
"Clinical Instrument" design, with a calibrated email/podcast/course funnel.
Targets `churn.thecranialdoc.com`.

### Added
- **Vite 5 + TypeScript (strict)** project scaffolded from the cvai-tools skeleton
  (self-only CSP via `public/_headers`, `el()`/`frag()` DOM helpers, self-hosted
  fonts — ITC Avant Garde, DM Sans, JetBrains Mono).
- **`calc.ts`** — pure, fully-tested calculation core: CSV parsing (UTF-8 BOM
  strip, CRLF, quoted/escaped fields), conservative column auto-detection,
  patient matching with **Patient ID > name** precedence, active / inactive /
  churn / net-momentum stats, identical-file detection, and CSV export with
  RFC-4180 escaping + formula-injection guard.
- **`state.ts`** — per-file-slot reducer (two independent slots, derived
  `canRun`, results invalidation on any file/column-mapping change).
- **Clinical Instrument UI** — graphite bezel header/footer, tool-focused hero,
  upload cards with column pickers (First/Last or Full Name + optional Patient
  ID) and inline parse/read errors, results view with a hero Net Momentum stat,
  a supporting stat row, and three parameterized export panels (warm zero states,
  100-row display cap).
- **Funnel** — `marketing.ts` single source of truth: email "Join the list" →
  thecranialdoc.com, podcast, and a soft Foundations course touch. Link-outs
  only; no on-page form, no patient data transmitted.
- **Privacy/PHI** — `LOCAL ONLY` badge + footer disclaimer; documented
  no-third-party-runtime invariant (CSP-enforced).
- **Tests** — 47 vitest unit tests (calc + reducer) and 2 Playwright e2e tests
  (happy path + non-CSV error). Typecheck + production build clean.

### Notes
- Not yet deployed. Remaining before launch: Cloudflare Pages project + DNS for
  `churn.thecranialdoc.com`, and confirming the canonical podcast / `/training`
  URLs in `marketing.ts` (see TODOS.md).
