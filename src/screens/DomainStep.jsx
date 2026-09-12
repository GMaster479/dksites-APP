import { useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { checkDomain, inspectDomain, connectDomain, domainStatus } from '../api/engine.js';

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
    return <ConnectOwnDomain go={go} project={project} />;
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


// ---- Connecting a domain the client already owns --------------------------------
// The commercially important path: most prospects own a domain and a bad site. Three
// stages — look it up, prepare our side, then walk them through the one setting they
// have to change. Their old site stays up the whole time.
function ConnectOwnDomain({ go, project }) {
  const [domain, setDomain] = useState('');
  const [info, setInfo] = useState(null);      // registrar lookup
  const [conn, setConn] = useState(null);      // our side prepared + nameservers
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [status, setStatus] = useState(null);  // propagation polling
  const [copied, setCopied] = useState(false);

  async function look() {
    setBusy(true); setErr(null);
    try { setInfo(await inspectDomain(domain.trim())); }
    catch (e) { setErr(e.message || 'Could not look that up.'); }
    setBusy(false);
  }

  async function prepare() {
    setBusy(true); setErr(null);
    try { setConn(await connectDomain(info?.domain || project.domain, project.previewId, project.slug)); }
    catch (e) { setErr(e.message || 'Could not set that up.'); }
    setBusy(false);
  }

  async function check() {
    setBusy(true); setErr(null);
    try { setStatus(await domainStatus(conn.domain, conn.zoneId)); }
    catch (e) { setErr(e.message || 'Could not check yet.'); }
    setBusy(false);
  }

  function copyNs() {
    try {
      navigator.clipboard.writeText((conn.nameservers || []).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  // Stage 3 — the walkthrough
  if (conn) {
    const w = conn.walkthrough || {};
    return (
      <div className="container" style={{ paddingTop: 24, maxWidth: 720 }}>
        <p className="eyebrow">Step 3 of 3</p>
        <h1>Point {conn.domain} at your new site</h1>
        <p className="sub" style={{ maxWidth: '60ch' }}>
          Your site is built and waiting. One setting at {w.registrar || 'your domain provider'} switches it over.
          {' '}Your current site stays up until the change takes effect.
        </p>

        <div className="card" style={{ marginTop: 18 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Enter these two nameservers</p>
          <div className="ns">
            {(conn.nameservers || []).map((n) => <code key={n} className="ns__item">{n}</code>)}
          </div>
          <div className="row" style={{ justifyContent: 'flex-start', marginTop: 10 }}>
            <button className="chip" onClick={copyNs}>{copied ? 'Copied ✓' : 'Copy both'}</button>
          </div>
          {w.nameserverNote && <p className="muted" style={{ margin: '10px 0 0' }}>{w.nameserverNote}</p>}
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>At {w.registrar || 'your provider'}</p>
          <ol className="steps">
            {(w.steps || []).map((st, i) => <li key={i}>{st}</li>)}
          </ol>
          {w.note && <p className="muted" style={{ margin: '10px 0 0' }}>{w.note}</p>}
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Done it?</p>
          <p className="muted" style={{ margin: '0 0 10px' }}>{w.propagation}</p>
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <Button onClick={check} disabled={busy}>{busy ? 'Checking…' : "Check if it's live"}</Button>
            <button className="btn btn--ghost" onClick={() => go('dashboard', { domain: conn.domain, ownDomain: true })}>
              I'll check later
            </button>
          </div>
          {status && (
            <p className="muted" style={{ marginTop: 12 }}>
              {status.active
                ? `✓ ${status.domain} is connected and secured with SSL.${status.serving ? ' Your site is loading.' : ' Give it another minute to start serving.'}`
                : `Not yet — still showing the old nameservers. This is normal; it usually takes 15 minutes to a couple of hours.`}
            </p>
          )}
          {err && <p className="ask__err">{err}</p>}
        </div>
      </div>
    );
  }

  // Stage 2 — registrar known: price it, then checkout. Nothing touches their domain yet.
  if (info && !project.paid) {
    const q = info.quote;
    return (
      <div className="center container">
        <p className="eyebrow">Step 2 of 3</p>
        <h1>{info.domain}</h1>
        <p className="sub">
          {info.registrar
            ? `Registered with ${info.registrar}. I'll give you exact click-by-click steps for their site.`
            : `I couldn't identify your provider, so I'll give you general steps that work almost everywhere.`}
        </p>

        {q && (
          <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'left' }}>
            {q.lineItems.map((li, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="muted">{li.label}</span><span>${li.amount.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, fontWeight: 700 }}>
              <span>Total</span><span>${q.total.toFixed(2)}</span>
            </div>
            <p className="muted" style={{ margin: '12px 0 0' }}>
              No domain charge — you already own {info.domain}.{' '}
              <strong>Keep paying your renewal at {info.registrar || 'your registrar'}.</strong>{' '}
              We host and secure the site; the domain stays yours. If it lapses, the site goes offline.
            </p>
          </div>
        )}

        {info.alreadyOnCloudflare && (
          <p className="muted" style={{ maxWidth: '52ch' }}>
            Heads up: this domain already uses Cloudflare nameservers, which needs a slightly
            different move. Continue and I'll show you what to do.
          </p>
        )}

        <div className="row">
          <Button onClick={() => go('checkout', {
            domain: info.domain, ownDomain: true, quote: q,
            registrar: info.registrar, walkthroughKey: info.walkthroughKey,
          })}>Continue to checkout</Button>
          <button className="btn btn--ghost" onClick={() => { setInfo(null); setErr(null); }}>Different domain</button>
        </div>
        {err && <p className="ask__err">{err}</p>}
      </div>
    );
  }

  // Stage 2b — paid, so prepare our side (deploy + zone) and hand over the nameservers.
  if (project.paid && !conn) {
    return (
      <div className="center container">
        <p className="eyebrow">Step 3 of 3</p>
        <h1>Ready to connect {project.domain || info?.domain}</h1>
        <p className="sub">I'll deploy your site and set up DNS, then show you the one setting to change.</p>
        <Button onClick={prepare} disabled={busy}>{busy ? 'Setting up…' : 'Set up my domain'}</Button>
        <p className="muted">Nothing changes on your domain until you enter the nameservers yourself.</p>
        {err && <p className="ask__err">{err}</p>}
      </div>
    );
  }

  // Stage 1 — which domain?
  return (
    <div className="center container">
      <p className="eyebrow">Step 1 of 3</p>
      <h1>Connect your domain</h1>
      <p className="sub">
        Enter the domain you already own. I'll figure out who it's registered with and give you
        the exact steps — no transfer, no downtime.
      </p>
      <div className="stack">
        <input className="input" placeholder="yourbusiness.com" value={domain}
          onChange={(e) => setDomain(e.target.value)} />
        <Button disabled={busy || !domain.includes('.')} onClick={look}>
          {busy ? 'Looking it up…' : 'Continue'}
        </Button>
        {err && <p className="ask__err">{err}</p>}
      </div>
    </div>
  );
}
