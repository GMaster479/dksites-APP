import { useState } from 'react';
import { Button } from '../components/Bits.jsx';

export default function DescribeBusiness({ go }) {
  const [desc, setDesc] = useState('');
  const [focus, setFocus] = useState('');
  const [site, setSite] = useState('');

  const description = [
    desc.trim(),
    focus.trim() && `MOST IMPORTANT: ${focus.trim()}`,
    site.trim() && `Existing site to draw from: ${site.trim()}`,
  ].filter(Boolean).join('\n\n');

  return (
    <div className="center container">
      <h1>Tell us about it</h1>
      <p className="sub">What you do, the vibe you want, colors you like, the kind of site you need. The more you share, the closer the first draft.</p>
      <div className="stack">
        <textarea className="input" placeholder="e.g. A cozy new coffee roaster in Hartford. Warm, earthy, a little vintage. Need a homepage, menu, and a story page." value={desc} onChange={(e) => setDesc(e.target.value)} />

        <div>
          <label>Anything in particular you want front and center? (optional)</label>
          <input className="input" placeholder="e.g. lead with catering — that's where the money is" value={focus} onChange={(e) => setFocus(e.target.value)} />
        </div>

        <div>
          <label>Already have a site? Paste it and I'll pull from it (optional)</label>
          <input className="input" placeholder="yourbusiness.com" value={site} onChange={(e) => setSite(e.target.value)} />
        </div>

        <Button disabled={desc.trim().length < 10} onClick={() => go('generating', { mode: 'greenfield', description, website: site.trim() || null })}>Build my site</Button>
      </div>
    </div>
  );
}
