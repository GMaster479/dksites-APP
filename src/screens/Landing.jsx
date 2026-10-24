import { Button } from '../components/Bits.jsx';

export default function Landing({ go, project, startFresh, user }) {
  const hasBuild = Boolean(project?.previewUrl) && !project?.live;
  return (
    <div className="page">
      {hasBuild && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2>Pick up where you left off</h2>
          <p className="muted" style={{ margin: 0 }}>
            {project.business?.name || 'Your site'} is saved and ready for changes.
          </p>
          <div className="row">
            <Button onClick={() => go('editor')}>Keep editing my site</Button>
            <Button variant="ghost" onClick={startFresh}>Start a different site</Button>
          </div>
        </div>
      )}

      <h1>A real website for your business, ready in minutes.</h1>
      <p className="sub">
        Tell us your business name. We build the site from your Google listing, your photos and your
        reviews. You make changes by just asking, and it goes live on your own web address.
      </p>
      <div className="row">
        <Button onClick={() => go('exists', {}, { fresh: !hasBuild ? true : false })}>Build my free preview</Button>
        {user && <Button variant="ghost" onClick={() => go('dashboard')}>Go to my sites</Button>}
      </div>

      <ul className="landing-facts">
        <li><strong>Free to try.</strong> Build and change it as much as you like. You only pay when it goes live.</li>
        <li><strong>No tech skills needed.</strong> Ask for changes in plain words. Each change only touches what you asked for.</li>
        <li><strong>It’s yours.</strong> Your web address, your site, and a real person to call: DK Sites, based in Connecticut.</li>
      </ul>
      <p className="muted" style={{ margin: 0 }}>
        Want it built by hand instead? <a href="https://dksitesllc.com">See DK Sites’ custom work</a>.
      </p>
    </div>
  );
}
