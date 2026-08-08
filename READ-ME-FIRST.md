# APP ONLY — upload buttons + prominent dismissable asks

`ls` must show index.html and vite.config.js. If you see run.js, wrong repo.

## Files
  src/screens/Editor.jsx   asks panel at the top + upload handling
  src/api/engine.js        uploadFile(); applyEdit now carries the upload records
  src/styles/tokens.css    styles for the asks panel

## What changed
The suggested asks ("upload your logo and I'll rebuild the palette around it") are now the
most prominent thing on the editor screen — a gold-bordered panel above the preview, each
ask its own card with a real Upload button. Every card has an x to dismiss it, and
dismissals persist per preview, so nobody gets nagged.

Uploads STAGE like everything else: the file uploads immediately (so it survives a reload)
and appears in Pending changes, but nothing regenerates until Apply changes. Exactly the
rule you set — no bypass for uploads.

## Apply — dksites-APP Codespace
    ls                                   # index.html and vite.config.js must be here
    unzip -o APP-uploads.zip
    cp -rf APP-uploads/. .
    rm -rf APP-uploads APP-uploads.zip
    grep -c "uploadFile" src/api/engine.js       # must print 2+
    git add -A && git commit -m "Upload buttons + prominent dismissable asks" && git push

Cloudflare Pages auto-builds on push. Wait for the green check, then hard-refresh
app.dksites.com. (The APP deploys itself — no box step for this half.)
