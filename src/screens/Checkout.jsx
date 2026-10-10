import { useState } from 'react';
import { Button } from '../components/Bits.jsx';
import SignIn from '../components/SignIn.jsx';
import { createCheckout } from '../api/engine.js';

// The account gate lives HERE — after they've fallen for the preview, before they pay.
// Signed out: sign in / create account (Google or an emailed link), then this same screen.
// Signed in: the total, the opt-in auto-renew box, and off to Stripe's hosted checkout.
export default function Checkout({ go, project, user, googleClientId, onSignedIn, notice }) {
  const [autoRenew, setAutoRenew] = useState(false); // OPT-IN. Never pre-checked.
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const total = project.quote?.total;
  const money = (n) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');

  if (!user) {
    return (
      <div className="center container">
        <p className="eyebrow">One step before checkout</p>
        <h1>Create your account to go live</h1>
        <p className="sub">It’s where you’ll edit {project.domain || 'your site'}, see renewals, and manage billing.</p>
        <SignIn
          googleClientId={googleClientId}
          onSignedIn={onSignedIn}
          heading="Continue"
          sub={googleClientId ? "Tip: use the Google account tied to your Google Business Profile." : undefined}
        />
      </div>
    );
  }

  async function pay() {
    setLoading(true); setErr(null);
    try {
      const { url } = await createCheckout({
        domain: project.domain, slug: project.slug, previewId: project.previewId,
        ownDomain: !!project.ownDomain, autoRenew,
      });
      // Stripe-hosted page. It sends them back to /?checkout=success or /?checkout=cancel.
      window.location.assign(url);
    } catch (e) {
      setLoading(false);
      if (e.needsSignIn) { onSignedIn?.(null); return; } // session expired — show sign-in again
      setErr(e.message || 'Could not open checkout.');
    }
  }

  return (
    <div className="center container">
      <h1>Make it live</h1>
      <p className="sub">Signed in as {user.email}. Card, Cash App, or Link.</p>
      <div className="stack">
        {notice && <div className="alert" style={{ textAlign: 'left', margin: 0 }}>{notice}</div>}
        <div className="card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Total (first year)</span><strong>{money(total)}</strong>
          </div>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            {project.ownDomain
              ? `Hosting, SSL & email + service fee. No domain charge — you keep ${project.domain} at ${project.registrar || 'your registrar'} and keep paying that renewal there.`
              : 'Itemized: domain + hosting/SSL/email + service fee.'}
          </p>
        </div>

        <label className="optin">
          <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
          <span>
            <strong>Renew automatically next year</strong>
            <span className="muted" style={{ display: 'block', marginTop: 2 }}>
              Optional. Saves your card so the site never lapses. Either way you’ll get an email 30 and 7 days before
              your renewal date, and you can turn this off anytime from your dashboard.{' '}
              <a href="/terms.html#renewals" target="_blank" rel="noreferrer">Renewal terms</a>.
              {autoRenew && ' Card or Link only (Cash App can’t be saved).'}
            </span>
          </span>
        </label>

        <Button disabled={loading} onClick={pay} style={{ justifyContent: 'center' }}>
          {loading ? 'Opening secure checkout…' : `Pay ${money(total)} & launch`}
        </Button>
        {err && <p className="ask__err" style={{ margin: 0 }}>{err}</p>}
        <p className="muted">You’ll pay on Stripe’s secure page, then come right back here.</p>
        <p className="muted" style={{ fontSize: '.82rem', margin: 0 }}>
          By paying you agree to the <a href="/terms.html" target="_blank" rel="noreferrer">Terms</a>{' '}
          (including <a href="/terms.html#refunds" target="_blank" rel="noreferrer">refunds</a>) and{' '}
          <a href="/privacy.html" target="_blank" rel="noreferrer">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
