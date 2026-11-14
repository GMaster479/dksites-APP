import { useEffect, useState } from 'react';
import { Button } from './Bits.jsx';
import { isInstalled } from './InstallPrompt.jsx';
import { getPushKey, savePushSubscription } from '../api/engine.js';

// "You can close the app — we'll tell you when it's done."
//
// Phones only show web notifications in certain cases:
//   Android / desktop Chrome, Edge, Firefox: yes, in the browser or installed
//   iPhone / iPad: only once DK Sites is on the Home Screen (iOS 16.4+)
// When notifications aren't possible, the server emails the owner instead, and this says so.

const FLAG = 'dksites-push-on';
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function pushSupport() {
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (ok) return 'yes';
  if (isIOS() && !isInstalled()) return 'ios-needs-install';
  return 'no';
}
export const pushPermission = () => (typeof Notification === 'undefined' ? 'default' : Notification.permission);

function keyBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function subscribe() {
  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await getPushKey();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  await savePushSubscription(sub.toJSON());
  try { localStorage.setItem(FLAG, '1'); } catch {}
}

/** Ask permission (must come from a tap) and register this device. */
export async function turnOnNotifications() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'denied' : 'dismissed');
  await subscribe();
}

/** Already allowed on this device: make sure the server has it for whoever is signed in. */
export async function refreshPushSubscription() {
  if (pushSupport() !== 'yes' || pushPermission() !== 'granted') return;
  try { await subscribe(); } catch {}
}

/** The card on the "Updating your site" screen. */
export function LeaveItWithUs({ user }) {
  const [state, setState] = useState(() => (pushPermission() === 'granted' ? 'on' : 'off'));
  const [busy, setBusy] = useState(false);
  const support = pushSupport();
  useEffect(() => { if (state === 'on') refreshPushSubscription(); }, []);

  async function enable() {
    setBusy(true);
    try { await turnOnNotifications(); setState('on'); }
    catch (e) { setState(e.message === 'denied' ? 'denied' : 'off'); }
    setBusy(false);
  }

  let detail;
  if (!user) {
    detail = <span className="muted">Come back any time to see it. Your change is saved as soon as it’s done.</span>;
  } else if (state === 'on') {
    detail = <span className="muted">✓ We’ll send a notification to this device when it’s done.</span>;
  } else if (support === 'yes' && state !== 'denied') {
    detail = (
      <>
        <span className="muted">Want a heads-up on this device when it’s done? Otherwise we’ll email {user.email}.</span>
        <Button variant="ghost" onClick={enable} disabled={busy} style={{ marginTop: 10 }}>{busy ? 'Turning on…' : 'Notify me when it’s done'}</Button>
      </>
    );
  } else if (support === 'ios-needs-install') {
    detail = <span className="muted">We’ll email {user.email} when it’s done. For a notification instead, add DK Sites to your Home Screen (Share, then Add to Home Screen).</span>;
  } else {
    detail = <span className="muted">We’ll email {user.email} when it’s done.</span>;
  }

  return (
    <div className="card leave" role="note">
      <strong>You can close the app.</strong>
      <span className="muted">Your change keeps going on our end, even if you lock your phone or switch apps.</span>
      {detail}
    </div>
  );
}
