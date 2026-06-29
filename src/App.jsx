import { useState } from 'react';
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

// Single source of truth for the wizard. `project` carries everything gathered along
// the way; `go` advances the step. Anonymous until the account step before checkout.
export default function App() {
  const [step, setStep] = useState('landing');
  const [project, setProject] = useState({});
  const go = (next, patch = {}) => {
    if (patch) setProject((p) => ({ ...p, ...patch }));
    setStep(next);
  };

  const screens = {
    landing: <Landing go={go} />,
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
