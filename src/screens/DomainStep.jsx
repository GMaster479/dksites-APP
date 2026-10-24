import { useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { checkDomain, inspectDomain, connectDomain, domainStatus } from '../api/engine.js';

export default function DomainStep({ go, project = {} }) {
  // Back from paying for an own-domain site: go straight to the connect steps.
  const [mode, setMode] = useState(project.ownDomain && project.paid ? 'own' : null); // 'new' | 'own'
  const [domain, setDomain] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  const [err, setErr] = useState(null);
  async function check(e) {
    e?.preventDefault();
    let d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\s+/g, '');
    if (!d) return;
    if (!d.includes('.')) d = `${d}.com`; // people often type just the name
    setDomain(d);
    setLoading(true); setErr(null); setQuote(null);
    try { setQuote(await checkDomain(d)); }
    catch { setErr('We couldn’t check that address just now. Try again in a moment.'); }
    setLoading(false);
  }

  if (!mode) {
    return (
      <div className="page">
        <h1>Choose your web address</h1>
        <p className="sub">Your web address (also called a domain) is what people type to find you, like <strong>yourbusiness.com</strong>.</p>
        <div className="stack">
          <button className="choice" onClick={() => setMode('new')}>
            <strong>Get a new web address</strong>
            <span>We find one that’s available and set it all up for you. The price is shown before you pay.</span>
          </button>
          <button className="choice" onClick={() => setMode('own')}>
            <strong>Use one I already own</strong>
            <span>Already paying for an address (maybe for an old site)? We’ll show you exactly how to point it here.</span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'own') {
    return <ConnectOwnDomain go={go} project={project} />;
  }

  return (
    <div className="page">
      <h1>Find your new web address</h1>
      <p className="sub">Try your business name. Short and easy to say out loud works best. If you leave off the ending, we’ll check .com.</p>
      <form className="stack" onSubmit={check}>
        <label htmlFor="dom">Web address you want</label>
        <input id="dom" className="input" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          placeholder="ginasbakery.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <Button type="submit" disabled={loading || !domain.trim()}>{loading ? 'Checking…' : 'See if it’s available'}</Button>
        <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => setMode(null)}>Go back</button>
      </form>
      {err && <div className="alert"><strong>Couldn’t check.</strong> <span className="muted">{err}</span></div>}
      {quote && (quote.available ? (
        <div className="card" style={{ textAlign: 'left' }}>
          <h2 style={{ marginBottom: 10 }}>Good news: {quote.domain} is available</h2>
          {quote.lineItems.map((li, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span className="muted">{li.label}</span><span>${li.amount.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, fontWeight: 700 }}>
            <span>Total (first term)</span><span>${quote.total.toFixed(2)}</span>
          </div>
          <p className="muted" style={{ margin: '10px 0 0' }}>That covers your first year. Before it renews we email you twice, and you decide.</p>
          <Button className="btn--block" onClick={() => go('checkout', { domain: quote.domain, quote })} style={{ marginTop: 14 }}>Use {quote.domain}</Button>
        </div>
      ) : (
        <div className="notice"><strong>{quote.domain} is already taken.</strong> <span className="muted">Try adding your town or what you do, like ginasbakeryct.com or ginascakes.com.</span></div>
      ))}
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
        <h1>Point {conn.domain} at your new site</h1>
        <p className="sub" style={{ maxWidth: '60ch' }}>
          Your site is built and waiting. One setting at {w.registrar || 'your domain provider'} switches it over.
          {' '}Your current site stays up until the change takes effect.
        </p>

        <div className="card" style={{ marginTop: 18 }}>
          <h3>Enter these two nameservers</h3>
          <p className="muted" style={{ margin: '0 0 10px' }}>Nameservers tell the internet where your website lives. Swapping them is the one setting that switches your address over.</p>
          <div className="ns">
            {(conn.nameservers || []).map((n) => <code key={n} className="ns__item">{n}</code>)}
          </div>
          <div className="row" style={{ justifyContent: 'flex-start', marginTop: 10 }}>
            <button className="chip" onClick={copyNs}>{copied ? 'Copied ✓' : 'Copy both'}</button>
          </div>
          {w.nameserverNote && <p className="muted" style={{ margin: '10px 0 0' }}>{w.nameserverNote}</p>}
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3>Where to change them at {w.registrar || 'your provider'}</h3>
          <ol className="steps">
            {(w.steps || []).map((st, i) => <li key={i}>{st}</li>)}
          </ol>
          {w.note && <p className="muted" style={{ margin: '10px 0 0' }}>{w.note}</p>}
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3>Done it?</h3>
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
      <div className="page">
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

        <div className="notice" style={{ textAlign: 'left', maxWidth: 520 }}>
          <strong>Do you have email at this address?</strong>{' '}
          <span className="muted" style={{ color: 'var(--paper-dim)' }}>
            Like you@{info.domain}. If so, text or call DK Sites at (860) 385-2334 before you switch it over,
            so we can make sure your email keeps working.
          </span>
        </div>

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
    <div className="page">
      <h1>Connect the address you own</h1>
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
