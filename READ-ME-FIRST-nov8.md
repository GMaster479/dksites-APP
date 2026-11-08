# APP — Nov 8

- Landing: "What is this, and what does it cost?" panel (what it is, who it's for, price,
  why not ChatGPT, why not Wix/Squarespace/GoDaddy, the step up to a custom DK Sites build)
- "What am I paying for?" under the price on the domain step and at checkout
- Help: honest cost answer, "Does it include email?", link to the explainer
- Connect-your-domain: shows the email provider found and the settings copied, or tells
  them to text you before switching if their DNS couldn't be read
- "Hosting, SSL & site editing" (no more "email"); Terms updated to match

## Codespace (dksites-APP)

    unzip -o APP-nov8.zip
    git rm -q -r src/pipeline.js src/analyze src/generate src/triage APP-legal.zip APP-mono.zip APP-oct10.zip APP-oct24.zip APP-sync.zip
    npm run build
    git add -A && git commit -m "Nov 8: plain-language explainers, pricing clarity, email check on connect" && git push
