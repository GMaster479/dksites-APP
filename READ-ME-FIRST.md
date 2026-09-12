# APP ONLY — multi-page menu uploads + connect-an-existing-domain

`ls` must show index.html and vite.config.js.

    unzip -o APP-sep6.zip
    cp -rf APP-sep6/. .
    rm -rf APP-sep6 APP-sep6.zip
    git add -A && git commit -m "Multi-page menus + existing-domain connect flow" && git push

Pages auto-builds. Hard-refresh app.dksites.com after the green check.
No box step for this half — but the ENGINE half must be on the box or the new screens
will call endpoints that don't exist yet.

## What changed
- The menu ask no longer retires after one upload: it shows "N pages added" and an
  "Add another page" button. Menu pages accumulate in Pending changes like photos do.
- "Use my own domain" is now a real three-stage flow instead of a dead-end text field:
  look up the registrar -> prepare our side (deploy + zone) -> show the exact nameservers
  and click-by-click steps for their registrar, with a live "check if it's live" button.
