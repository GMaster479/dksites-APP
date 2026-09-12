# APP ONLY — own-domain checkout before the walkthrough

    ls        # index.html and vite.config.js must be here
    unzip -o APP-own.zip
    cp -rf APP-own/. .
    rm -rf APP-own APP-own.zip
    git add -A && git commit -m "Own-domain checkout + renewal warning" && git push

Needs the ENGINE half on the box first, or the pricing call returns nothing.

## Flow now
1. Enter the domain they own -> we identify the registrar.
2. Itemized $128.70 with "no domain charge" and, in bold, keep paying your renewal at
   <registrar>. If it lapses the site goes offline.
3. Checkout.
4. Only after payment: deploy + zone, then the click-by-click nameserver steps and a
   live "check if it's live" button.
