// Small shared UI bits.
export function Logo({ size = '1.3rem' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="wordmark" style={{ fontSize: size }}>DK SITES</span>
      <span className="muted" style={{ fontFamily: 'var(--display)', fontSize: '.7rem', letterSpacing: '.2em' }}>BUILDER</span>
    </div>
  );
}

export function Button({ variant = 'gold', children, ...props }) {
  return <button className={`btn btn--${variant}`} {...props}>{children}</button>;
}

// 8 wizard steps shown as a progress bar (landing & dashboard excluded).
const FLOW = ['exists', 'confirm', 'describe', 'generating', 'editor', 'domain', 'checkout', 'launching'];
export function Progress({ step }) {
  const idx = FLOW.indexOf(step);
  if (idx < 0) return null;
  return (
    <div className="progress">
      {FLOW.map((s, i) => (
        <div key={s} className={`progress__seg ${i < idx ? 'progress__seg--done' : i === idx ? 'progress__seg--now' : ''}`} />
      ))}
    </div>
  );
}
