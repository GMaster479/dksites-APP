import { useEffect, useState } from 'react';
import { Sheet, Button } from './Bits.jsx';

// "Save DK Sites to your phone" — our own explanation, not just the browser's tiny install
// icon. Shown only to ACTIVE people: right after their site finishes building, or when a
// signed-in owner comes back for a second visit. Never twice in a row, never once installed.

const KEY = 'dksites-install';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...v })); } catch {} };

export const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isPhone = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 900);

// Chrome/Android hands us an install event; keep it so our button can trigger it.
let deferred = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
}

/** Count signed-in visits (once per browser session). */
export function noteSignedInVisit() {
  try {
    if (sessionStorage.getItem('dksites-visit-counted')) return;
    sessionStorage.setItem('dksites-visit-counted', '1');
  } catch {}
  write({ visits: (read().visits || 0) + 1 });
}

/** Should we offer it now? reason: 'built' | 'returning' */
export function shouldOfferInstall(reason) {
  if (isInstalled() || !isPhone()) return false;
  const s = read();
  if (s.never) return false;
  if (s.lastShown && Date.now() - s.lastShown < 14 * 86400000) return false; // not more than every 2 weeks
  if (reason === 'returning') return (s.visits || 0) >= 2;
  return reason === 'built';
}

export default function InstallPrompt({ onClose }) {
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  const ios = isIOS();

  useEffect(() => {
    write({ lastShown: Date.now() });
    const t = setInterval(() => setCanPrompt(!!deferred), 500);
    return () => clearInterval(t);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    deferred = null;
    onClose();
  }

  return (
    <Sheet title="Keep your site one tap away" onClose={onClose}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '10px 0 4px' }}>
        <img className="install__icon" src="/icons/icon-192.png" alt="" />
        <p style={{ margin: 0, color: 'var(--paper-dim)' }}>
          Save DK Sites to your home screen. It opens like an app, so checking on your site or asking for a change takes seconds.
        </p>
      </div>

      {ios ? (
        <ol className="install__steps">
          <li>Tap the <strong>Share</strong> button{' '}
            <svg className="ios-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Share icon"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>{' '}
            at the bottom of Safari (top right on iPad).</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>.</li>
        </ol>
      ) : canPrompt ? null : (
        <ol className="install__steps">
          <li>Tap the <strong>⋮</strong> menu at the top right of your browser.</li>
          <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
        </ol>
      )}

      <div className="row" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
        {!ios && canPrompt && <Button onClick={install}>Add to my home screen</Button>}
        <Button variant="ghost" onClick={onClose}>{ios || !canPrompt ? 'Got it' : 'Not now'}</Button>
      </div>
      <button className="link" style={{ marginTop: 14, fontSize: '.9rem', color: 'var(--stone)' }}
        onClick={() => { write({ never: true }); onClose(); }}>Don’t ask again</button>
    </Sheet>
  );
}
