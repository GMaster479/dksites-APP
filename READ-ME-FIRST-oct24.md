# APP — Oct 24: monochrome DK Sites look + easier for non-tech owners

- Space Grotesk + IBM Plex Sans, the cream "dk" mark, ink/paper colors (privacy + terms match)
- Step ruler at the top: tap it to see every step explained. Hidden when an owner opens an
  existing or live site from their dashboard.
- New step: "Add your logo and photos" (logo, outside, inside, more photos) + social links,
  pre-filled from their current website. Phone photos are shrunk before upload.
- Editor: shows what changed after each update, lists earlier changes with Undo, social links,
  "Start over with a fresh design", and live sites get "Back to my sites" (not "Make it live").
- Dashboard: Delete a preview. Sign out link (the header hides it on phones).
- Help button: text/call/email Dylan + plain-language FAQ.
- "Keep your site one tap away": add-to-home-screen prompt on phones, only after a build
  finishes or on a signed-in owner's 2nd visit. Installable app (manifest + icons + offline page).
- Domain step in plain words; warns own-domain owners with email at that address to call first.

## Codespace (dksites-APP)

    unzip -o APP-oct24.zip
    npm run build                     # must say "built" with no errors
    git add -A && git commit -m "Oct 24: monochrome DK Sites redesign, uploads step, help, install, delete preview" && git push
