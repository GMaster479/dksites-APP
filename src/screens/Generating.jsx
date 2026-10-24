import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { generateSite } from '../api/engine.js';

const STAGES = [
  'Reading about your business…',
  'Choosing colors that fit your brand…',
  'Picking fonts that match your style…',
  'Designing a signature touch…',
  'Writing and building the pages…',
  'Putting it on a preview link…',
];

export default function Generating({ go, project }) {
  const [stage, setStage] = useState(0);
  const [liveStage, setLiveStage] = useState(null);
  const [error, setError] = useState(null);

  function start() {
    setError(null);
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 9000);
    generateSite(project, (label) => setLiveStage(label))
      // justBuilt: lets the app offer "save to your home screen" to an active person.
      .then((res) => { clearInterval(t); go('editor', { ...res, justBuilt: true }); })
      .catch((e) => { clearInterval(t); setError(e.message || 'The build stopped before finishing.'); });
    return t;
  }

  useEffect(() => {
    const t = start();
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <div className="page">
        <h1>Your site didn’t finish building</h1>
        <p className="sub">Nothing was charged, and your logo and photos are saved. This is usually temporary, so trying again normally works.</p>
        <p className="muted" style={{ margin: 0 }}>What went wrong: {error}</p>
        <div className="row">
          <Button onClick={start}>Try again</Button>
          <Button variant="ghost" onClick={() => go('extras')}>Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="center container" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <h1>Building your site</h1>
      <p className="sub">{liveStage || STAGES[stage]}</p>
      <p className="muted" style={{ maxWidth: '38ch' }}>Usually 3 to 5 minutes. Keep this page open; your site will appear here when it’s ready.</p>
    </div>
  );
}
