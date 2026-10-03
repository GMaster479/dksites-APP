# APP — Accounts (Oct 3)

Replaces these files:
- src/App.jsx — sign-in state, Sign in / Dashboard / Admin / Sign out in the header,
  handles returns from email links and Stripe, attaches signed-out previews to the account
- src/api/engine.js — sends the session cookie on every call; account/dashboard/admin calls
- src/components/SignIn.jsx (new) — Continue with Google + email me a link
- src/screens/Checkout.jsx — account gate, opt-in auto-renew box (unchecked), and it now
  actually sends people to Stripe (before, it skipped payment)
- src/screens/Dashboard.jsx — real data: live sites, renewal dates, previews, billing portal
- src/screens/Admin.jsx (new) — accounts, sales, renewals, reminder controls
- src/styles/tokens.css — styles for the above

## Codespace (dksites-APP)

    unzip -o APP-accounts.zip
    git add -A && git commit -m "Accounts: sign-in, checkout gate, dashboard, admin" && git push

Cloudflare Pages rebuilds app.dksites.com by itself.
Ship the ENGINE zip to the box FIRST — this app expects the new sign-in routes.
