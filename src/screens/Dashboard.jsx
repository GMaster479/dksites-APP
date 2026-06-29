import { Button } from '../components/Bits.jsx';

// Home base after launch — what turns a one-shot build into a recurring relationship.
export default function Dashboard({ project }) {
  const domain = project.domain || 'yourbusiness.com';
  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <p className="eyebrow">Your dashboard</p>
      <h1 style={{ marginBottom: 18 }}>{domain}</h1>
      <div className="grid2">
        <div className="card">
          <h2>Site</h2>
          <p className="muted">Live · SSL active</p>
          <div className="row" style={{ justifyContent: 'flex-start', marginTop: 10 }}>
            <a className="btn btn--ghost" href={`https://${domain}`}>Visit</a>
            <Button>Edit my site</Button>
          </div>
        </div>
        <div className="card">
          <h2>Billing</h2>
          <p className="muted">Next renewal in 12 months · manage card</p>
          <Button variant="ghost" style={{ marginTop: 10 }}>Manage billing</Button>
        </div>
        <div className="card">
          <h2>Domain & email</h2>
          <p className="muted">{domain} · forwarding to your inbox</p>
        </div>
        <div className="card">
          <h2>Need a change?</h2>
          <p className="muted">Reopen the editor any time — text, photos, or ask for anything.</p>
          <Button variant="ghost" style={{ marginTop: 10 }}>Open editor</Button>
        </div>
      </div>
    </div>
  );
}
