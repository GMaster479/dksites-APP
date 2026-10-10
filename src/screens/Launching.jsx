import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { getLaunchStatus, domainStatus } from '../api/engine.js';

// Real launch progress. Stripe sends them back with ?session_id=…; the engine records the
// purchase, runs the launch, and writes each step onto the site row. This screen polls
// that, then (once our side is done) checks whether the domain actually answers yet.

const FALLBACK_STEPS = [
  { key: 'payment', label: 'Payment confirmed' },
  { key: 'publish', label: 'Publishing your site' },
  { key: 'register', label: 'Registering your domain' },
  { key: 'dns', label: 'Setting up DNS & SSL' },
  { key: 'nameservers', label: 'Pointing your domain at your site' },
  { key: 'live', label: 'Going live worldwide' },
].map((s) => ({ ...s, state: 'pending' }));

const ACTIVE = new Set(['confirming_payment', 'starting', 'running']);
const ICON = { done: '✓', skipped: '✓', running: '•', warning: '!', error: '✕', pending: '○' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Launching({ go, project }) {
  const sessionId = project.stripeSessionId || null;
  const [data, setData] = useState(null);
  const [live, setLive] = useState(null); // { serving, active } once our side is done
  const [err, setErr] = useState(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [slowPayment, setSlowPayment] = useState(false);
  const started = useRef(Date.now());

  // 1. Our side: poll the launch until it stops moving.
  useEffect(() => {
    if (!sessionId) return;
    let off = false;
    (async () => {
      for (;;) {
        if (off) return;
        try {
          const d = await getLaunchStatus({ sessionId });
          if (off) return;
          setData(d); setErr(null);
          if (d.status === 'confirming_payment' && Date.now() - started.current > 90000) setSlowPayment(true);
          if (!ACTIVE.has(d.status)) return;
        } catch (e) {
          if (off) return;
          if (e.needsSignIn) { setNeedsSignIn(true); return; }
          setErr(e.message);
        }
        await wait(Date.now() - started.current > 90000 ? 5000 : 2000);
      }
    })();
    return () => { off = true; };
  }, [sessionId]);

  // 2. The world's side: once launched, does the domain answer yet? (DNS can take hours.)
  const zoneId = data?.zoneId;
  const domain = data?.domain || project.domain;
  const finished = data?.status === 'done' || data?.status === 'needs_attention';
  useEffect(() => {
    if (!finished || !zoneId || !domain) return;
    let off = false;
    (async () => {
      for (let i = 0; i < 240 && !off; i++) { // ~1 hour of checks while the page is open
        try {
          const s = await domainStatus(domain, zoneId);
          if (off) return;
          setLive(s);
          if (s.serving && s.active) return;
        } catch {}
        await wait(15000);
      }
    })();
    return () => { off = true; };
  }, [finished, zoneId, domain]);

  if (!sessionId) {
    return (
      <div className="center container">
        <h1>Payment received</h1>
        <p className="sub">Your launch is running. Follow it from your dashboard.</p>
        <Button onClick={() => go('dashboard')}>Go to my dashboard</Button>
      </div>
    );
  }

  if (needsSignIn) {
    return (
      <div className="center container">
        <h1>Payment received</h1>
        <p className="sub">Your site is being launched. Sign in to follow along — it’s on your dashboard.</p>
        <Button onClick={() => go('dashboard')}>Sign in</Button>
      </div>
    );
  }

  const isLive = !!(live?.serving && live?.active);
  const testMode = finished && !zoneId; // dry-run launches have no DNS to check
  const steps = (data?.steps?.length ? data.steps : FALLBACK_STEPS).map((s) => {
    if (s.key !== 'live') return s;
    if (isLive || testMode) return { ...s, state: 'done' };
    if (finished) return { ...s, state: 'running', detail: 'Usually 15 minutes to a few hours' };
    return s;
  });

  const status = data?.status || 'confirming_payment';
  const heading =
    isLive ? 'You’re live 🎉'
      : status === 'error' ? 'We hit a snag'
        : testMode ? 'Launch complete (test mode)'
          : finished ? 'Launched — going live'
          : status === 'confirming_payment' ? 'Confirming payment…'
            : 'Launching…';

  return (
    <div className="center container">
      <h1>{heading}</h1>
      {domain && <p className="sub" style={{ wordBreak: 'break-all' }}>{domain}</p>}

      <div className="stack launch" style={{ maxWidth: 420 }}>
        {steps.map((s) => (
          <div key={s.key} className={`launch__step launch__step--${s.state}`}>
            <span className="launch__icon" aria-hidden="true">{ICON[s.state] || '○'}</span>
            <span>
              {s.label}
              {s.detail && s.state !== 'done' && <span className="muted launch__detail">{s.detail}</span>}
            </span>
          </div>
        ))}
      </div>

      {slowPayment && status === 'confirming_payment' && (
        <p className="muted" style={{ maxWidth: 420 }}>
          Still waiting on Stripe’s confirmation. Your payment is safe — this page will catch up, or check your dashboard in a few minutes.
        </p>
      )}
      {err && <p className="muted" style={{ maxWidth: 420 }}>Reconnecting… ({err})</p>}

      {status === 'needs_attention' && !isLive && (
        <p className="muted" style={{ maxWidth: 420 }}>
          We’re double-checking one step by hand. There’s nothing you need to do — we’ll email you when it’s confirmed.
        </p>
      )}
      {status === 'error' && (
        <div className="alert" style={{ maxWidth: 420, textAlign: 'left' }}>
          <strong>Your payment is safe.</strong>{' '}
          <span className="muted">
            Something failed on our side while setting up {domain}. We’ve been notified and will finish it and email you.
            Questions? <a href="mailto:dylan@dksitesllc.com">dylan@dksitesllc.com</a>
          </span>
        </div>
      )}

      {(finished || status === 'error') && (
        <>
          {isLive && <p className="sub">Your site is live at <a href={`https://${domain}`} target="_blank" rel="noreferrer"><strong>{domain}</strong></a>.</p>}
          {finished && !isLive && !testMode && (
            <p className="muted" style={{ maxWidth: 420 }}>
              Everything on our side is done. The internet takes a little while to catch up — the padlock (SSL) turns on by itself.
              You can close this page; we’ve emailed you, and your dashboard shows it too.
            </p>
          )}
          {testMode && <p className="muted">Test mode: nothing was registered or charged.</p>}
          <div className="row">
            {isLive && <a className="btn btn--ghost" href={`https://${domain}`} target="_blank" rel="noreferrer">Visit site</a>}
            <Button onClick={() => go('dashboard')}>Go to my dashboard</Button>
          </div>
        </>
      )}
    </div>
  );
}
