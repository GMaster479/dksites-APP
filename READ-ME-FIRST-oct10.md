# APP — Oct 10 fixes

- src/screens/Launching.jsx — real launch progress (polls the engine), then checks when the
  domain actually answers. Clear messages for "being double-checked" and "we hit a snag".
- src/screens/Dashboard.jsx — auto-renew on/off switch on each live site; status pill
  (Launching / Finishing up / Being fixed / Live)
- src/screens/Admin.jsx — launch column with Retry / Mark done; Database backups card
- src/App.jsx — Stripe return goes to real progress; auto-renew return banners
- src/api/engine.js, src/styles/tokens.css — the calls and styles for the above

## Codespace (dksites-APP) — after the ENGINE is on the box

    unzip -o APP-oct10.zip
    git add -A && git commit -m "Oct 10: real launch progress, auto-renew switch, admin backups" && git push

Cloudflare Pages rebuilds app.dksites.com by itself (about a minute).
