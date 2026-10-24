import { useEffect, useRef } from 'react';

// Small shared UI bits.
export function Logo() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="/dk-mark-96.png" alt="" width="34" height="34" />
      <span className="brand__name">DK Sites<span className="brand__sub">Builder</span></span>
    </span>
  );
}

export function Button({ variant = 'primary', children, className = '', ...props }) {
  const v = variant === 'gold' ? 'primary' : variant;
  return <button className={`btn btn--${v} ${className}`} {...props}>{children}</button>;
}

// ---- The build steps, in the words a business owner would use ----------------------
// confirm and describe are two ways through the same step, so they share a slot.
export const STEPS = [
  { keys: ['exists'], name: 'Start', what: 'Tell us whether your business is already online. That decides whether we look you up or you describe it.' },
  { keys: ['confirm', 'describe'], name: 'Find your business', what: 'We find you on Google and pull in your hours, reviews and photos. New business? Describe it in a few sentences instead.' },
  { keys: ['extras'], name: 'Add your logo and photos', what: 'Optional, and it makes a big difference: your logo, a photo of the outside and inside, and your Facebook or Instagram.' },
  { keys: ['generating'], name: 'We build your site', what: 'Takes about 3 to 5 minutes. It’s a real website made for your business, not a template.' },
  { keys: ['editor'], name: 'Make changes', what: 'Ask for changes in your own words, as many as you like. Each one changes only what you asked for. Free until you go live.' },
  { keys: ['domain'], name: 'Choose your web address', what: 'Pick a new address (like yourbusiness.com) or connect one you already own.' },
  { keys: ['checkout'], name: 'Create your account and pay', what: 'Sign in with Google or your email, then pay securely through Stripe. You see the full price before paying.' },
  { keys: ['launching'], name: 'Go live', what: 'We publish your site and turn on the secure padlock. It usually shows up within a few hours.' },
];
export const stepIndex = (step) => STEPS.findIndex((s) => s.keys.includes(step));

// The ruler: tap anywhere on it to see every step explained.
export function Progress({ step, onExplain }) {
  const idx = stepIndex(step);
  if (idx < 0) return null;
  return (
    <div className="ruler">
      <button className="ruler__bar" onClick={onExplain}
        aria-label={`Step ${idx + 1} of ${STEPS.length}: ${STEPS[idx].name}. Show all steps.`}>
        {STEPS.map((s, i) => (
          <span key={s.name} className={`ruler__seg ${i < idx ? 'ruler__seg--done' : i === idx ? 'ruler__seg--now' : ''}`} />
        ))}
      </button>
      <div className="ruler__label">
        <span><span className="ruler__count">Step {idx + 1} of {STEPS.length}</span>{'  '}<span className="ruler__now">{STEPS[idx].name}</span></span>
        <button className="ruler__help" onClick={onExplain}>What happens next?</button>
      </div>
    </div>
  );
}

export function StepGuide({ step, onClose }) {
  const idx = stepIndex(step);
  return (
    <Sheet title="How it works" onClose={onClose}>
      <p className="muted" style={{ margin: '4px 0 0' }}>Building and changing your site is free. You only pay at step 7, when you put it on your own web address.</p>
      <ol className="guide">
        {STEPS.map((s, i) => (
          <li key={s.name} data-state={i < idx ? 'done' : i === idx ? 'now' : 'next'}>
            <span className="guide__n">{i < idx ? '✓' : i + 1}</span>
            <div><strong>{s.name}</strong><p>{s.what}</p></div>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}

// Accessible bottom sheet / dialog: Escape closes, focus moves in and returns on close.
export function Sheet({ title, onClose, children, labelledBy }) {
  const card = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    card.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet__card" role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy} tabIndex={-1} ref={card}>
        {onClose && <button className="sheet__x" onClick={onClose} aria-label="Close">×</button>}
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

// A yes/no question that's easier to read (and to tap) than the browser's confirm box.
export function Confirm({ title, children, yes = 'Yes', no = 'Cancel', danger = false, onYes, onNo, busy = false }) {
  return (
    <Sheet title={title} onClose={onNo}>
      <div style={{ color: 'var(--paper-dim)', margin: '8px 0 20px' }}>{children}</div>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onYes} disabled={busy}>{busy ? 'Working…' : yes}</Button>
        <Button variant="ghost" onClick={onNo} disabled={busy}>{no}</Button>
      </div>
    </Sheet>
  );
}
