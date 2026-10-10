import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import SignIn from '../components/SignIn.jsx';
import { getMySites, openBillingPortal, setAutoRenew } from '../api/engine.js';

// Home base: every live site and every preview this account owns.
const dateStr = (ms) =>
  ms ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const money = (n) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');

// What the pill on a live-site card says. Customers never see raw launch errors.
function sitePill(s) {
  if (s.status !== 'active') return { text: s.status, cls: '' };
  switch (s.launchStatus) {
    case 'starting':
    case 'running': return { text: 'Launching', cls: '' };
    case 'needs_attention': return { text: 'Finishing up', cls: 'pill--warn' };
    case 'error': return { text: 'Being fixed', cls: 'pill--err' };
    default: return { text: 'Live', cls: 'pill--on' };
  }
}

// The auto-renew switch. OFF is instant. ON is instant if a card is already saved;
// otherwise Stripe saves one (no charge) and sends them back here.
function AutoRenewSwitch({ site, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const on = site.autoRenew;

  async function flip() {
    setErr(null);
    if (on && !window.confirm(
      `Turn off auto-renew for ${site.domain}?\n\nNothing will be charged next year. We’ll email you 30 and 7 days before ${dateStr(site.renewsAt)} so you can renew by hand.`
    )) return;
    setBusy(true);
    try {
      const r = await setAutoRenew(site.id, !on);
      if (r.needsCard && r.url) { window.location.assign(r.url); return; }
      onChanged({ ...site, autoRenew: !!r.autoRenew });
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <>
      <button type="button" role="switch" aria-checked={on} className={`switch ${on ? 'switch--on' : ''}`} onClick={flip} disabled={busy}>
        <span className="switch__track" />
        <span>{busy ? (on ? 'Turning off…' : 'One moment…') : on ? 'On' : 'Off'}</span>
      </button>
      <span className="muted" style={{ display: 'block', fontSize: '.82rem', marginTop: 4 }}>
        {on ? 'Renews by itself. You’ll still get a heads-up email first.' : 'We’ll email you 30 & 7 days before.'}
      </span>
      {err && <span className="ask__err" style={{ display: 'block', marginTop: 4 }}>{err}</span>}
    </>
  );
}

export default function Dashboard({ user, googleClientId, onSignedIn, openBuild, go }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let off = false;
    getMySites()
      .then((d) => { if (!off) setData(d); })
      .catch((e) => { if (!off) setErr(e.message); });
    return () => { off = true; };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="center container">
        <h1>Your dashboard</h1>
        <p className="sub">Sign in to see your sites, previews, and renewals.</p>
        <SignIn googleClientId={googleClientId} onSignedIn={onSignedIn} heading="Sign in" />
      </div>
    );
  }

  async function billing() {
    setBillingBusy(true); setErr(null);
    try { const { url } = await openBillingPortal(); window.location.assign(url); }
    catch (e) { setErr(e.message); setBillingBusy(false); }
  }

  const sites = data?.sites || [];
  const liveIds = new Set(sites.map((s) => s.previewId));
  const previews = (data?.builds || []).filter((b) => !liveIds.has(b.previewId));
  const canBill = sites.some((s) => s.canManageBilling);
  const previewUrlFor = (s) =>
    (data?.builds || []).find((b) => b.previewId === s.previewId)?.previewUrl || (s.slug ? `https://${s.slug}.dksites.com/` : null);

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <p className="eyebrow">Your dashboard</p>
      <h1 style={{ marginBottom: 6 }}>{user.name ? `Hi, ${user.name.split(' ')[0]}` : 'Your sites'}</h1>
      <p className="muted" style={{ margin: '0 0 22px' }}>{user.email}</p>

      {err && <div className="alert"><strong>Something went wrong.</strong> <span className="muted">{err}</span></div>}
      {!data && !err && <div className="spinner" style={{ margin: '40px auto' }} />}

      {data && (
        <>
          <div className="dash__head">
            <h2>Live sites</h2>
            {canBill && (
              <Button variant="ghost" onClick={billing} disabled={billingBusy}>
                {billingBusy ? 'Opening…' : 'Manage billing & receipts'}
              </Button>
            )}
          </div>

          {sites.length === 0 ? (
            <div className="card dash__empty">
              <p className="muted" style={{ margin: 0 }}>No live sites yet. Finish a preview below and launch it on your domain.</p>
            </div>
          ) : (
            <div className="grid2">
              {sites.map((s) => (
                <div className="card" key={s.id}>
                  <div className="dash__row">
                    <h2 style={{ wordBreak: 'break-all' }}>{s.domain}</h2>
                    <span className={`pill ${sitePill(s).cls}`}>{sitePill(s).text}</span>
                  </div>
                  <dl className="dash__facts">
                    <dt>Paid</dt><dd>{money(s.amount)} · {dateStr(s.paidAt)}</dd>
                    <dt>Renews</dt><dd>{dateStr(s.renewsAt)}</dd>
                    <dt>Auto-renew</dt>
                    <dd><AutoRenewSwitch site={s} onChanged={(ns) => setData((d) => ({ ...d, sites: d.sites.map((x) => (x.id === ns.id ? ns : x)) }))} /></dd>
                    {s.ownDomain && <><dt>Domain</dt><dd>Yours — keep it paid at your registrar</dd></>}
                  </dl>
                  <div className="row" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
                    <a className="btn btn--ghost" href={`https://${s.domain}`} target="_blank" rel="noreferrer">Visit</a>
                    {s.previewId && (
                      <Button onClick={() => openBuild({ previewId: s.previewId, slug: s.slug, previewUrl: previewUrlFor(s), domain: s.domain, ownDomain: s.ownDomain, live: true })}>
                        Edit site
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="dash__head" style={{ marginTop: 34 }}>
            <h2>Previews</h2>
            <button className="chip" onClick={() => go('exists')}>+ Build another</button>
          </div>
          {previews.length === 0 ? (
            <div className="card dash__empty"><p className="muted" style={{ margin: 0 }}>Nothing in progress.</p></div>
          ) : (
            <div className="grid2">
              {previews.map((b) => (
                <div className="card" key={b.previewId}>
                  <h2>{b.name || b.slug || 'Untitled site'}</h2>
                  <p className="muted" style={{ margin: '4px 0 14px' }}>Started {dateStr(b.claimedAt)}</p>
                  <div className="row" style={{ justifyContent: 'flex-start' }}>
                    {b.previewUrl && <a className="btn btn--ghost" href={b.previewUrl} target="_blank" rel="noreferrer">Preview</a>}
                    <Button onClick={() => openBuild(b)}>Keep editing</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: 34 }}>
            <h2>Want it custom?</h2>
            <p className="muted" style={{ margin: '4px 0 12px' }}>
              DK Sites can design and hand-build your site. Ask about it anytime — at renewal, what you’d pay for year two comes off the price.
            </p>
            <a className="btn btn--ghost" href="mailto:dylan@dksitesllc.com?subject=Custom%20DK%20Sites%20build">Talk to DK Sites</a>
          </div>
        </>
      )}
    </div>
  );
}
