import { useState } from 'react';
import { Button } from '../components/Bits.jsx';

export default function DescribeBusiness({ go }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [focus, setFocus] = useState('');
  const [site, setSite] = useState('');

  const description = [
    name.trim() && `Business name: ${name.trim()}`,
    desc.trim(),
    focus.trim() && `MOST IMPORTANT: ${focus.trim()}`,
    site.trim() && `Existing site to draw from: ${site.trim()}`,
  ].filter(Boolean).join('\n\n');

  return (
    <div className="page">
      <h1>Tell us about your business</h1>
      <p className="sub">Write it like you’d explain it to a friend. The more you share, the closer the first version will be.</p>
      <div className="stack">
        <div className="field">
          <label htmlFor="dname">Business name</label>
          <input id="dname" className="input" placeholder="e.g. Hartford Coffee Roasters" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ddesc">What you do, and the feel you want</label>
          <textarea id="ddesc" className="input" placeholder="e.g. A cozy new coffee roaster in Hartford. Warm and a little vintage. We need our menu, hours, and a page about our story."
            value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="dfocus">What should people see first? <span className="hint">Optional</span></label>
          <input id="dfocus" className="input" placeholder="e.g. our catering, that’s where most of our business is" value={focus} onChange={(e) => setFocus(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="dsite">Already have a website? <span className="hint">Optional. We’ll read it for your menu and details.</span></label>
          <input id="dsite" className="input" inputMode="url" placeholder="yourbusiness.com" value={site} onChange={(e) => setSite(e.target.value)} />
        </div>
        <Button disabled={desc.trim().length < 10}
          onClick={() => go('extras', { mode: 'greenfield', description, business: name.trim() ? { name: name.trim() } : undefined, website: site.trim() || null })}>
          Next: add your logo and photos
        </Button>
      </div>
    </div>
  );
}
