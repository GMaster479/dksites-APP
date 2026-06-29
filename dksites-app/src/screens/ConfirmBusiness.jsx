import { useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { lookupBusiness } from '../api/engine.js';

export default function ConfirmBusiness({ go }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    setLoading(true);
    const r = await lookupBusiness(name, city);
    setResult(r); setSearched(true); setLoading(false);
  }

  return (
    <div className="center container">
      <h1>Let’s find you</h1>
      <p className="sub">Your business name and town — that’s all we need to pull everything in.</p>
      <div className="stack">
        <input className="input" placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="City, State" value={city} onChange={(e) => setCity(e.target.value)} />
        <Button disabled={loading || !name} onClick={search}>{loading ? 'Searching…' : 'Find my business'}</Button>
      </div>

      {result && (
        <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'left' }}>
          <p className="eyebrow">Is this you?</p>
          <div style={{ display: 'flex', gap: 14 }}>
            <img src={result.photo} alt="" width="90" height="68" style={{ borderRadius: 8, objectFit: 'cover' }} />
            <div>
              <strong>{result.name}</strong>
              <p className="muted" style={{ margin: '4px 0' }}>{result.address}</p>
              <p className="muted">★ {result.rating} · {result.userRatingCount} reviews</p>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
            <Button onClick={() => go('generating', { mode: 'existing', business: result })}>Yes — build it</Button>
            <button className="btn btn--ghost" onClick={() => setResult(null)}>Not me</button>
          </div>
        </div>
      )}

      {searched && !result && <p className="muted">Couldn’t find it? You can <button className="chip" onClick={() => go('describe')}>describe it instead</button></p>}
    </div>
  );
}
