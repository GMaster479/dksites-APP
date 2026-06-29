# DK Sites Builder — Front End

The React app that wraps the DK Sites engine. Vanilla stays for the *generated client
sites*; this *app* is React (Vite). Designed in the DK Sites palette with Orbitron + Inter.

## The flow (src/screens)

Landing → ExistsQuestion (yes/no fork) → ConfirmBusiness *or* DescribeBusiness →
Generating → **Editor** (3 zones + in-place text/image editing) → DomainStep
(new/own) → Checkout (account gate) → Launching → Dashboard.

State lives in `App.jsx` (`project` + `go(step, patch)`). The wizard is anonymous until
the account step before checkout — that's the conversion design.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

The app runs standalone today: `src/api/engine.js` returns mock data so every screen
works without the backend. To connect the real engine, replace each function body with a
`fetch` to the engine's HTTP API and set `VITE_ENGINE_URL`.

## In-place editing

The Editor's "Edit text & images" toggle makes only whitelisted elements editable
(`data-editable` text nodes become `contentEditable`; images get a Replace affordance).
Structure and design stay prompt-only. In production the live site loads in an `<iframe>`
and the same `data-editable` markers (added by the generator) drive what's editable.

## Deploy to Cloudflare Pages (app.dksites.com)

1. Push this folder to a new GitHub repo (e.g. `dksites-app`).
2. Cloudflare dashboard → **Workers & Pages** → Create → **Pages** → Connect to Git →
   pick the repo.
3. Build settings: **Framework preset: Vite**, **Build command: `npm run build`**,
   **Build output directory: `dist`**.
4. Add env var `VITE_ENGINE_URL` (when the engine API exists) under Settings → Environment
   variables.
5. Deploy. Then Custom domains → add **app.dksites.com** (Cloudflare adds the CNAME for you
   since dksites.com is already in your account).

Every `git push` auto-builds and deploys. That's the GitHub→Cloudflare loop — unlike the
Worker (which you deploy with `wrangler`), Pages deploys straight from the repo.

## Next wiring (engine API)

The engine is currently CLI-driven. To power this app for real, it needs a thin HTTP API
in front of the pipeline (endpoints for lookup, generate, edit-options, apply-edit, check,
checkout). That API is the bridge between this front end and everything already built.
