import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';

const STEPS = ['Payment confirmed', 'Registering your domain', 'Deploying your site', 'Securing it with SSL', 'Going live'];

export default function Launching({ go, project }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone((d) => (d < STEPS.length ? d + 1 : d)), 900);
    return () => clearInterval(t);
  }, []);
  const live = done >= STEPS.length;

  return (
    <div className="center container">
      <h1>{live ? 'You’re live 🎉' : 'Launching…'}</h1>
      <div className="stack" style={{ maxWidth: 380 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: i < done ? 1 : 0.4 }}>
            <span style={{ color: 'var(--liquid-gold-bright)' }}>{i < done ? '✓' : '○'}</span>{s}
          </div>
        ))}
      </div>
      {live && (
        <>
          <p className="sub">Your site is live at <strong>{project.domain || 'yourdomain.com'}</strong>{project.ownDomain ? ' (SSL finishes within the hour as DNS propagates).' : '.'}</p>
          <Button onClick={() => go('dashboard')}>Go to my dashboard</Button>
        </>
      )}
    </div>
  );
}
