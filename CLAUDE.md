# Patient Activity Calculator

Free in-browser practice-retention calculator for chiropractors. Upload two
monthly adjustment-export CSVs → active / inactive / churn / new-conversion /
net-momentum stats + one-click CSV downloads. All processing is client-side; no
patient data is transmitted. Being rebuilt as a Vite + TypeScript sister tool to
cvai-tools, deploying to `churn.thecranialdoc.com` as a The Cranial Doc brand
surface with a calibrated email/podcast/course funnel.

## Deployment
- **Platform:** Cloudflare Pages → `churn.thecranialdoc.com` (sister to cvai-tools).
- **Build:** `npm run build` · **Output:** `dist` · **Node:** 20 (`.nvmrc`).
- Security headers + CSP (self-only) + cache rules ship via `public/_headers`
  (copied to `dist/_headers` at build). Production branch: `master` (auto-deploy).
- Full steps + post-deploy verification: see `DEPLOY.md`.

## Design System
Always read DESIGN.md before making any visual or UI decisions. All font
choices, colors, spacing, and aesthetic direction are defined there ("Clinical
Instrument": cold graphite + clinical teal, ITC Avant Garde + DM Sans +
JetBrains Mono for numbers). Do not deviate without explicit user approval. In
QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
