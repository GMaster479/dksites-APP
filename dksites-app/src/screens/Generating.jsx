import { useEffect, useState } from 'react';
import { generateSite } from '../api/engine.js';

const STAGES = [
  'Reading your business…',
  'Choosing colors from your brand…',
  'Picking type that fits your vibe…',
  'Designing a signature touch…',
  'Building the pages…',
  'Putting it on a preview link…',
];

export default function Generating({ go, project }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1000);
    generateSite(project).then((res) => {
      clearInterval(t);
      go('editor', { ...res });
    });
    return () => clearInterval(t);
  }, []);

  return (
    <div className="center container">
      <div className="spinner" />
      <h1>Building your site</h1>
      <p className="sub">{STAGES[stage]}</p>
      <p className="muted">Usually 3–5 minutes. Hang tight — this is the fun part.</p>
    </div>
  );
}
