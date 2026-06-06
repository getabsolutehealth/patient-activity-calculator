# Deploy — churn.thecranialdoc.com

Static Vite build on **Cloudflare Pages**, same setup as the sister tool
cvai-tools (calc.thecranialdoc.com). Two ways to do it — connect the GitHub repo
in the dashboard (recommended, gives auto-deploy on every push), or deploy from
the CLI with Wrangler.

## Build settings (both methods)

| Setting | Value |
|---|---|
| Framework preset | None (or "Vite") |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20` (pinned in `.nvmrc`; or set env `NODE_VERSION=20`) |
| Root directory | `/` (repo root) |

The CSP, security headers, and cache rules ship via `public/_headers`, which Vite
copies to `dist/_headers` at build time — Cloudflare Pages applies it
automatically. No extra config needed.

## Option A — Dashboard (recommended, auto-deploys on push)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Pick `getabsolutehealth/patient-activity-calculator`.
3. Production branch: **`master`** (so it deploys after PR #1 merges).
4. Build command `npm run build`, output dir `dist`. Add env var
   `NODE_VERSION = 20`.
5. Save & Deploy. First build gives a `*.pages.dev` URL — verify it works.
6. **Custom domain:** project → **Custom domains** → **Set up a domain** →
   `churn.thecranialdoc.com`. If `thecranialdoc.com`'s DNS is on Cloudflare, the
   CNAME is created for you. If DNS is elsewhere, add a CNAME:
   `churn` → `<project>.pages.dev` (proxied/orange-cloud if on Cloudflare).
7. Wait for the cert to issue (a minute or two), then load
   `https://churn.thecranialdoc.com`.

Every push to `master` now auto-builds and deploys. PRs get preview URLs.

## Option B — CLI (Wrangler), one-off or scripted

```bash
npm run build
npx wrangler pages deploy dist --project-name=patient-activity-calculator
```

First run prompts a browser login and offers to create the Pages project. Set the
custom domain in the dashboard (step 6 above) afterward.

## Post-deploy verification (do this once live)

- Load the page, upload two sample CSVs, hit **Run Analysis** — numbers render.
- **Open DevTools → Network and confirm NO request carries patient/CSV data.**
  The only outbound calls should be the page assets and (when clicked) the
  funnel link-outs. This is the privacy promise; verify it on the real domain.
- Check the response headers include the `Content-Security-Policy` from
  `_headers` (DevTools → Network → the document request → Headers).
- Mobile width (375px): export panels stack and collapse.

## Before launch (from TODOS.md)

- Confirm the canonical **podcast** and **`/training`** URLs in
  `src/marketing.ts` (email already points at the thecranialdoc.com homepage).
- Confirm the **ITC Avant Garde** font license covers this deployment (inherited
  from cvai-tools, which ships it under the same brand).
