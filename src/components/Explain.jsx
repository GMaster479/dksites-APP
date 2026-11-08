import { Sheet } from './Bits.jsx';

// Plain-language answers to "what is this, what does it cost, and why not something else?"
// The long version lives on dksites.com; this is the version people see inside the app.

export function PriceExplainer({ ownDomain = false }) {
  return (
    <details className="explainer">
      <summary>What am I paying for?</summary>
      <dl>
        {!ownDomain && (<>
          <dt>Your web address</dt>
          <dd>The name people type to find you (like yourbusiness.com), charged at what the registrar charges us. It’s registered for you and it’s yours.</dd>
        </>)}
        <dt>Hosting, SSL &amp; site editing</dt>
        <dd>Keeping your site online all year, the secure padlock browsers look for, and making changes through the editor whenever you want.</dd>
        <dt>DK Sites service fee</dt>
        <dd>30% of the above. It pays for the builder, the design rules it follows, and a real person you can text when you need help.</dd>
      </dl>
      <p className="muted" style={{ margin: '8px 0 0' }}>
        One payment for the year, no monthly plan. Renewing costs the same, and we email you before it does.
        Not included: email inboxes, online ordering or booking systems, or custom programming.
      </p>
    </details>
  );
}

export function WhySheet({ onClose }) {
  return (
    <Sheet title="What is DK Sites Builder?" onClose={onClose}>
      <div className="why">
        <p>It builds a real website for your business from your Google listing, your photos and your reviews, puts it on your own web address, and lets you change it by just asking.</p>

        <h3>Who it’s for</h3>
        <p>Businesses and organizations that need to be online now but don’t have the budget for a designer, anyone on staff who does websites, or weeks to learn a website editor.</p>

        <h3>What it costs</h3>
        <p>Building and changing your site is free. When you go live you pay once for the year: about <strong>$147</strong> with a new .com address, or <strong>$128.70</strong> if you already own one. No monthly plan.</p>

        <h3>Why not just ask ChatGPT?</h3>
        <p>A chatbot can write a web page, but you’d still need to buy the address, host it, turn on the padlock, check every fact and keep it working. The Builder does all of that, and it follows a design rulebook written by a designer with over a decade of experience who still builds sites for local businesses every week. It never makes up a price, menu item or hour.</p>

        <h3>Why not Wix, Squarespace or GoDaddy?</h3>
        <p>Those are good if you want to design the site yourself. With them you learn an editor and pay monthly (about $204–$228 a year for their basic plans with your own address). Here the site is built for you, you change it by asking, you pay once a year, and you can ask for your site’s files any time.</p>

        <h3>Want a person to build it with you?</h3>
        <p>That’s a step up: a hand-built DK Sites website, designed with you, with things like ordering, booking and multi-page sites. <a href="https://dksitesllc.com/" target="_blank" rel="noreferrer">See DK Sites custom work</a>.</p>
      </div>
    </Sheet>
  );
}
