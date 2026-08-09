import { useState, useEffect, useRef } from 'react';
import { Logo, Progress } from './components/Bits.jsx';
import Landing from './screens/Landing.jsx';
import ExistsQuestion from './screens/ExistsQuestion.jsx';
import ConfirmBusiness from './screens/ConfirmBusiness.jsx';
import DescribeBusiness from './screens/DescribeBusiness.jsx';
import Generating from './screens/Generating.jsx';
import Editor from './screens/Editor.jsx';
import DomainStep from './screens/DomainStep.jsx';
import Checkout from './screens/Checkout.jsx';
import Launching from './screens/Launching.jsx';
import Dashboard from './screens/Dashboard.jsx';

// Wizard state persists to localStorage so a reload (or bouncing out to the live preview
// on mobile, which evicts the tab) restores the person right where they were instead of
// resetting to the landing page. 'generating' is never restored directly — a reload
// mid-generation would poll a dead job — so it falls forward to the editor if a preview
// already exists, otherwise back to landing.
const STORAGE_KEY = 'dksites-project-v1';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
// Which steps are reachable given what the project actually holds. Guards Forward and any
// stale history entry from dropping someone into a screen with nothing behind it.
function canEnter(step, project = {}) {
  switch (step) {
    case 'landing':
    case 'exists':
    case 'confirm':
    case 'describe':
      return true;
    case 'editor':
    case 'domain':
      return !!project.previewUrl;
    case 'checkout':
      return !!project.previewUrl && !!project.domain;
    case 'dashboard':
      return !!project.domain;
    default:
      return false;
  }
}

function safeStep(saved) {
  if (!saved?.step) return 'landing';
  if (saved.step === 'generating' || saved.step === 'launching') {
    return saved.project?.previewUrl ? 'editor' : 'landing';
  }
  return canEnter(saved.step, saved.project || {}) ? saved.step : 'landing';
}

export default function App() {
  const saved = loadSaved();
  const [step, setStep] = useState(safeStep(saved));
  const [project, setProject] = useState(saved?.project || {});

  // Refs so the popstate handler always sees CURRENT state — it's registered once, and a
  // stale closure was how Forward could land you somewhere that no longer exists.
  const projectRef = useRef(project);
  const stepRef = useRef(step);
  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { stepRef.current = step; }, [step]);

  // Browser Back/Forward walk the wizard, but a step is only entered if the data it needs
  // actually exists. Hitting Forward after starting over shouldn't teleport you into an
  // editor for a build that's gone — it should simply do nothing.
  useEffect(() => {
    // Re-anchor history to whatever we restored on load, so Back/Forward and a plain
    // refresh agree with each other instead of fighting.
    window.history.replaceState({ dksitesStep: stepRef.current }, '');

    const onPop = (e) => {
      const p = projectRef.current || {};
      const raw = e.state?.dksitesStep;
      if (!raw) return;
      // generating/launching are transient — never restore into a dead poll.
      const target = raw === 'generating' || raw === 'launching'
        ? (p.previewUrl ? 'editor' : 'landing')
        : raw;

      if (!canEnter(target, p)) {
        // Stay put and re-anchor, so the history entry isn't left pointing at a dead step.
        window.history.pushState({ dksitesStep: stepRef.current }, '');
        return;
      }
      setStep(target);
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next, patch = {}) => {
    setProject((p) => {
      const np = { ...p, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: next, project: np })); } catch {}
      return np;
    });
    setStep(next);
    try { window.history.pushState({ dksitesStep: next }, ''); } catch {}
  };

  const startFresh = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setProject({});
    setStep('landing');
  };

  const screens = {
    landing: <Landing go={go} project={project} startFresh={startFresh} />,
    exists: <ExistsQuestion go={go} />,
    confirm: <ConfirmBusiness go={go} project={project} />,
    describe: <DescribeBusiness go={go} />,
    generating: <Generating go={go} project={project} />,
    editor: <Editor go={go} project={project} />,
    domain: <DomainStep go={go} project={project} />,
    checkout: <Checkout go={go} project={project} />,
    launching: <Launching go={go} project={project} />,
    dashboard: <Dashboard project={project} />,
  };

  return (
    <div className="app-shell">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', padding: '16px 24px' }}>
        <button onClick={() => setStep('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Logo /></button>
        <Progress step={step} />
      </div>
      {screens[step]}
    </div>
  );
}
