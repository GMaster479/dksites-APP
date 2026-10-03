import { useEffect, useRef, useState } from 'react';
import { Button } from './Bits.jsx';
import { sendMagicLink, signInWithGoogle } from '../api/engine.js';

// Sign in or create an account — same thing here. Two ways in:
//   - Continue with Google (ideally the account tied to their Google Business Profile)
//   - an emailed link, no password to remember
// Both land on the same account if the email matches.

let gsiLoading = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoading) return gsiLoading;
  gsiLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Google sign-in could not load.'));
    document.head.appendChild(s);
  });
  return gsiLoading;
}

export default function SignIn({ googleClientId, onSignedIn, heading = 'Sign in', sub }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !btnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            setErr(null);
            try {
              const { user } = await signInWithGoogle(credential);
              onSignedIn?.(user);
            } catch (e) {
              setErr(e.message || 'Google sign-in failed.');
            }
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black', size: 'large', text: 'continue_with', shape: 'pill', width: 300,
        });
      })
      .catch((e) => setErr(e.message));
    return () => { cancelled = true; };
  }, [googleClientId]);

  async function sendLink() {
    setBusy(true); setErr(null);
    try { await sendMagicLink(email.trim()); setSent(true); }
    catch (e) { setErr(e.message || 'Could not send the email.'); }
    setBusy(false);
  }

  return (
    <div className="card signin">
      <h2 style={{ marginBottom: 6 }}>{heading}</h2>
      {sub && <p className="muted" style={{ margin: '0 0 16px' }}>{sub}</p>}

      {googleClientId && (
        <>
          <div ref={btnRef} className="signin__google" />
          <div className="signin__or"><span>or use your email</span></div>
        </>
      )}

      {sent ? (
        <div className="signin__sent">
          <strong>Check your email.</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            I sent a sign-in link to {email}. Open it on this device — it works once and expires in 15 minutes.
          </p>
          <button className="chip" style={{ marginTop: 12 }} onClick={() => setSent(false)}>Use a different email</button>
        </div>
      ) : (
        <div className="stack" style={{ maxWidth: 'none' }}>
          <input className="input" type="email" autoComplete="email" placeholder="you@business.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && email.includes('@')) sendLink(); }} />
          <Button variant="ghost" disabled={busy || !email.includes('@')} onClick={sendLink} style={{ justifyContent: 'center' }}>
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </Button>
        </div>
      )}
      {err && <p className="ask__err">{err}</p>}
      <p className="muted" style={{ margin: '14px 0 0', fontSize: '.8rem' }}>No password needed. New here? This creates your account.</p>
    </div>
  );
}
