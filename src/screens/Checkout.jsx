import { useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { createCheckout } from '../api/engine.js';

// Account creation is gated HERE — they've already fallen in love with the preview.
export default function Checkout({ go, project }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    const { url } = await createCheckout({ domain: project.domain, slug: project.slug, previewId: project.previewId, email });
    // In production: window.location = url;  (Stripe-hosted page)
    setLoading(false);
    go('launching'); // demo: skip straight to launch status
  }

  return (
    <div className="center container">
      <h1>Make it live</h1>
      <p className="sub">Create your account and check out. Card, Cash App, or Link.</p>
      <div className="stack">
        <div>
          <label>Email (your account + receipt)</label>
          <input className="input" type="email" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Total (first term)</span><strong>${project.quote?.total?.toFixed(2) ?? '—'}</strong></div>
          <p className="muted" style={{ margin: '8px 0 0' }}>Itemized: domain + hosting/SSL/email + service fee. Renews yearly; cancel anytime.</p>
        </div>
        <Button disabled={loading || !email.includes('@')} onClick={pay} style={{ justifyContent: 'center' }}>{loading ? 'Opening secure checkout…' : 'Pay & launch'}</Button>
        <p className="muted">Test mode: no real charge. Pay on the next (Stripe) screen.</p>
      </div>
    </div>
  );
}
