import { Button } from '../components/Bits.jsx';

export default function ExistsQuestion({ go }) {
  return (
    <div className="center container">
      <h1>Does your business<br />already exist?</h1>
      <p className="sub">If you’re already online, we’ll pull your info, photos, and reviews automatically — barely any typing.</p>
      <div className="grid2" style={{ maxWidth: 640, width: '100%' }}>
        <div className="card card--tap" onClick={() => go('confirm')}>
          <h2>Yes, we’re established</h2>
          <p className="muted">We’ll find you on Google and build from what’s already out there.</p>
        </div>
        <div className="card card--tap" onClick={() => go('describe')}>
          <h2>No, we’re new</h2>
          <p className="muted">Tell us about it and we’ll design something from scratch.</p>
        </div>
      </div>
    </div>
  );
}
