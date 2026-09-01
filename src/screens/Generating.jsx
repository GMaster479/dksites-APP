import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';
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
  const [liveStage, setLiveStage] = useState(null);
  const [error, setError] = useState(null);

  function start() {
    setError(null);
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1000);
    generateSite(project, (label) => setLiveStage(label))
      .then((res) => { clearInterval(t); go('editor', { ...res }); })
      // A failure used to leave the person watching a spinner forever — say what happened
      // and give them a way out instead.
      .catch((e) => { clearInterval(t); setError(e.message || 'The build failed.'); });
    return t;
  }

  useEffect(() => {
    const t = start();
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <div className="center container">
        <h1>That build didn't finish</h1>
        <p className="sub">{error}</p>
        <p className="muted">Nothing was charged. This is usually temporary — trying again often works.</p>
        <div className="row">
          <Button onClick={start}>Try again</Button>
          <button className="btn btn--ghost" onClick={() => go('exists')}>Start over</button>
        </div>
      </div>
    );
  }

  return (
    <div className="center container">
      <div className="spinner" />
      <h1>Building your site</h1>
      <p className="sub">{liveStage || STAGES[stage]}</p>
      <p className="muted">Usually 3–5 minutes. Hang tight — this is the fun part.</p>
    </div>
  );
}
