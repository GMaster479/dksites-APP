import { useState } from 'react';
import { Button } from '../components/Bits.jsx';

export default function DescribeBusiness({ go }) {
  const [desc, setDesc] = useState('');
  return (
    <div className="center container">
      <h1>Tell us about it</h1>
      <p className="sub">What you do, the vibe you want, colors you like, the kind of site you need. The more you share, the closer the first draft.</p>
      <div className="stack">
        <textarea className="input" placeholder="e.g. A cozy new coffee roaster in Hartford. Warm, earthy, a little vintage. Need a homepage, menu, and a story page." value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Button disabled={desc.trim().length < 10} onClick={() => go('generating', { mode: 'greenfield', description: desc })}>Build my site</Button>
      </div>
    </div>
  );
}
