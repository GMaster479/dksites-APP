import { useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { lookupBusiness } from '../api/engine.js';

export default function ConfirmBusiness({ go }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [err, setErr] = useState(null);

  async function search(e) {
    e?.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setErr(null); setResult(null);
    try {
      const r = await lookupBusiness(name.trim(), city.trim());
      setResult(r?.name ? r : null);
    } catch (x) {
      setErr('We couldn’t search just now. Check your connection and try again.');
    }
    setSearched(true); setLoading(false);
  }

  return (
    <div className="page">
      <h1>Let’s find your business</h1>
      <p className="sub">Type it the way it shows on Google. Adding your town helps us pick the right one.</p>

      <form className="stack" onSubmit={search}>
        <div className="field">
          <label htmlFor="biz">Business name</label>
          <input id="biz" className="input" autoComplete="organization" placeholder="e.g. Gina’s Bakery"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="town">Town and state</label>
          <input id="town" className="input" autoComplete="address-level2" placeholder="e.g. New Britain, CT"
            value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading || !name.trim()}>{loading ? 'Searching Google…' : 'Find my business'}</Button>
      </form>

      {err && <div className="alert"><strong>Search didn’t work.</strong> <span className="muted">{err}</span></div>}

      {result && (
        <div className="card" aria-live="polite">
          <h2 style={{ marginBottom: 12 }}>Is this you?</h2>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {result.photo && <img src={result.photo} alt="" width="96" height="72" style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
            <div>
              <strong style={{ fontFamily: 'var(--display)', fontSize: '1.1rem' }}>{result.name}</strong>
              {result.address && <p className="muted" style={{ margin: '2px 0' }}>{result.address}</p>}
              {result.rating && <p className="muted" style={{ margin: 0 }}>★ {result.rating} from {result.userRatingCount} Google reviews</p>}
            </div>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <Button onClick={() => go('extras', { mode: 'existing', business: result, description: null })}>Yes, that’s us</Button>
            <Button variant="ghost" onClick={() => setResult(null)}>No, search again</Button>
          </div>
        </div>
      )}

      {searched && !result && !err && (
        <div className="notice">
          <strong>We couldn’t find that one.</strong>{' '}
          <span className="muted">Try the name exactly as it shows on Google, or add your town. Not on Google yet?</span>{' '}
          <button className="link" onClick={() => go('describe')}>Describe your business instead</button>
        </div>
      )}
    </div>
  );
}
