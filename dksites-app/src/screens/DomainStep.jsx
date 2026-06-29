import { useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { checkDomain } from '../api/engine.js';

export default function DomainStep({ go }) {
  const [mode, setMode] = useState(null); // 'new' | 'own'
  const [domain, setDomain] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    setQuote(await checkDomain(domain.toLowerCase()));
    setLoading(false);
  }

  if (!mode) {
    return (
      <div className="center container">
        <h1>Your domain</h1>
        <p className="sub">Register a fresh one, or connect a domain you already own.</p>
        <div className="grid2" style={{ maxWidth: 640, width: '100%' }}>
          <div className="card card--tap" onClick={() => setMode('new')}><h2>Register new</h2><p className="muted">We’ll find and buy it for you.</p></div>
          <div className="card card--tap" onClick={() => setMode('own')}><h2>Use my own</h2><p className="muted">We’ll walk you through pointing it here.</p></div>
        </div>
      </div>
    );
  }

  if (mode === 'own') {
    return (
      <div className="center container">
        <h1>Connect your domain</h1>
        <p className="sub">Enter it and we’ll detect your registrar and give you exact, click-by-click steps to point it here. Your site goes live the same day — no waiting on a transfer.</p>
        <div className="stack">
          <input className="input" placeholder="yourbusiness.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <Button disabled={!domain} onClick={() => go('checkout', { domain, ownDomain: true })}>Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="center container">
      <h1>Find your domain</h1>
      <div className="stack">
        <input className="input" placeholder="yourbusiness.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <Button disabled={loading || !domain} onClick={check}>{loading ? 'Checking…' : 'Check availability'}</Button>
      </div>
      {quote && (quote.available ? (
        <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'left' }}>
          <p className="eyebrow">{quote.domain} is available</p>
          {quote.lineItems.map((li, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span className="muted">{li.label}</span><span>${li.amount.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, fontWeight: 700 }}>
            <span>Total (first term)</span><span>${quote.total.toFixed(2)}</span>
          </div>
          <Button onClick={() => go('checkout', { domain: quote.domain, quote })} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Continue to checkout</Button>
        </div>
      ) : <p className="muted">{quote.domain} is taken — try another.</p>)}
    </div>
  );
}
