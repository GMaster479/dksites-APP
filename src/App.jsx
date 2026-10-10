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
import Admin from './screens/Admin.jsx';
import { getMe, signOut, claimBuilds } from './api/engine.js';

// Wizard state persists to localStorage so a reload (or bouncing out to the live preview
// on mobile, which evicts the tab) restores the person right where they were instead of
// resetting to the landing page. 'generating' is never restored directly — a reload
// mid-generation would poll a dead job — so it falls forward to the editor if a preview
// already exists, otherwise back to landing.
const STORAGE_KEY = 'dksites-project-v1';
// Previews made while signed out. They're attached to the account on sign-in, so nobody
// loses the site they built before creating an account.
const BUILDS_KEY = 'dksites-my-builds';

function rememberBuild(b) {
  try {
    const list = JSON.parse(localStorage.getItem(BUILDS_KEY)) || [];
    const rest = list.filter((x) => x.previewId !== b.previewId);
    localStorage.setItem(BUILDS_KEY, JSON.stringify([b, ...rest].slice(0, 20)));
  } catch {}
}
function pendingBuilds() {
  try { return JSON.parse(localStorage.getItem(BUILDS_KEY)) || []; } catch { return []; }
}
const buildRecord = (p) => ({
  previewId: p.previewId, slug: p.slug || null, previewUrl: p.previewUrl || null,
  name: p.business?.name || p.name || null,
});

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
    case 'launching':
      return !!project.stripeSessionId; // real launch progress needs the Stripe checkout id
    case 'dashboard':
    case 'admin':
      return true; // each screen shows sign-in / admins-only itself
    default:
      return false;
  }
}

function safeStep(saved) {
  if (!saved?.step) return 'landing';
  if (saved.step === 'launching' && saved.project?.stripeSessionId) return 'launching'; // resumes polling
  if (saved.step === 'generating' || saved.step === 'launching') {
    return saved.project?.previewUrl ? 'editor' : 'landing';
  }
  return canEnter(saved.step, saved.project || {}) ? saved.step : 'landing';
}

export default function App() {
  const saved = loadSaved();
  const [step, setStep] = useState(safeStep(saved));
  const [project, setProject] = useState(saved?.project || {});
  const [user, setUser] = useState(null);
  const [googleClientId, setGoogleClientId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [checkoutNotice, setCheckoutNotice] = useState(null);

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
      const target = raw === 'generating' || (raw === 'launching' && !p.stripeSessionId)
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

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const go = (next, patch = {}, { fresh = false } = {}) => {
    setProject((p) => {
      const np = fresh ? { ...patch } : { ...p, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: next, project: np })); } catch {}
      // A new preview just came back: remember it so it can be attached to an account.
      if (patch.previewId && patch.previewId !== p.previewId) {
        const rec = buildRecord(np);
        if (userRef.current) claimBuilds([rec]).catch(() => rememberBuild(rec));
        else rememberBuild(rec);
      }
      return np;
    });
    setStep(next);
    try { window.history.pushState({ dksitesStep: next }, ''); } catch {}
  };

  // Attach any previews made while signed out to the account that just signed in.
  const claimPending = async () => {
    const list = pendingBuilds();
    if (!list.length) return;
    try { await claimBuilds(list); localStorage.removeItem(BUILDS_KEY); } catch {}
  };

  const onSignedIn = (u) => {
    setUser(u || null);
    if (u) claimPending();
  };

  const doSignOut = async () => {
    try { await signOut(); } catch {}
    setUser(null);
    if (stepRef.current === 'dashboard' || stepRef.current === 'admin') go('landing');
  };

  // On load: who's signed in, and what did a redirect (email link, Stripe) bring us back for?
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const hadParams = ['signedin', 'signin', 'checkout', 'view', 'session_id', 'autorenew'].some((k) => q.has(k));
    if (hadParams) window.history.replaceState({ dksitesStep: stepRef.current }, '', window.location.pathname);

    getMe()
      .then(({ user: u, googleClientId: gid }) => {
        setGoogleClientId(gid || null);
        onSignedIn(u);
      })
      .catch(() => {})
      .finally(() => {
        const p = projectRef.current || {};
        if (q.get('signin') === 'expired') {
          setBanner('That sign-in link expired or was already used. Send yourself a new one.');
        }
        if (q.get('checkout') === 'success') {
          // Paid. Own domain: back to the connect walkthrough. Otherwise: live launch progress,
          // which works even in a different browser than the one that built the site.
          const sid = q.get('session_id');
          if (p.ownDomain && p.previewUrl && p.domain) go('domain', { paid: true });
          else if (sid) go('launching', { paid: true, stripeSessionId: sid });
          else go('dashboard');
        } else if (q.get('checkout') === 'cancel') {
          setCheckoutNotice('Checkout canceled — nothing was charged.');
          if (canEnter('checkout', p)) go('checkout');
        } else if (q.get('view') === 'dashboard' || q.get('view') === 'admin') {
          if (q.get('autorenew') === 'on') setBanner({ ok: true, text: 'Card saved — auto-renew is on. Nothing was charged today.' });
          if (q.get('autorenew') === 'cancel') setBanner('No card was saved, so auto-renew is still off.');
          go(q.get('view'));
        } else if (q.get('signedin') && stepRef.current === 'landing') {
          go('dashboard'); // opened the email link somewhere with no build in progress
        }
      });
  }, []);

  const openBuild = (b) => go('editor', {
    previewId: b.previewId, slug: b.slug || null, previewUrl: b.previewUrl || null,
    business: b.name ? { name: b.name } : undefined,
    ...(b.domain ? { domain: b.domain, ownDomain: !!b.ownDomain, live: true } : {}),
  }, { fresh: true });

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
    checkout: <Checkout go={go} project={project} user={user} googleClientId={googleClientId}
      onSignedIn={onSignedIn} notice={checkoutNotice} />,
    launching: <Launching go={go} project={project} />,
    dashboard: <Dashboard user={user} googleClientId={googleClientId} onSignedIn={onSignedIn}
      openBuild={openBuild} go={(s) => (s === 'exists' ? go('exists', {}, { fresh: true }) : go(s))} />,
    admin: <Admin user={user} />,
  };

  return (
    <div className="app-shell">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', padding: '16px 24px', gap: 16 }}>
        <button onClick={() => setStep('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Logo /></button>
        <Progress step={step} />
        <nav className="acct">
          {user ? (
            <>
              <button className="acct__link" onClick={() => go('dashboard')}>Dashboard</button>
              {user.isAdmin && <button className="acct__link" onClick={() => go('admin')}>Admin</button>}
              <button className="acct__link acct__link--dim" onClick={doSignOut} title={user.email}>Sign out</button>
            </>
          ) : (
            <button className="acct__link" onClick={() => go('dashboard')}>Sign in</button>
          )}
        </nav>
      </div>
      {banner && (
        <div className="container" style={{ paddingBottom: 0 }}>
          <div className={banner.ok ? 'notice' : 'alert'} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, margin: 0 }}>
            <span>{typeof banner === 'string' ? banner : banner.text}</span>
            <button className="ask__x" style={{ position: 'static' }} onClick={() => setBanner(null)}>×</button>
          </div>
        </div>
      )}
      {screens[step]}
    </div>
  );
}
