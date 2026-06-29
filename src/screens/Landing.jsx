import { Button } from '../components/Bits.jsx';

export default function Landing({ go }) {
  return (
    <div className="center container">
      <p className="eyebrow">A DK Sites LLC Project</p>
      <h1>An AI that builds your<br />business a <span className="wordmark">real website</span>.</h1>
      <p className="sub">Hand-crafted quality, generated in minutes — then we put it live on your own domain. No templates. No page-builders. No monthly bloat.</p>
      <div className="row">
        <Button onClick={() => go('exists')}>Build my site — free preview</Button>
        <a className="btn btn--ghost" href="https://dksitesllc.com">See our work</a>
      </div>
      <p className="muted">Free to preview. You only pay when you love it and go live.</p>
    </div>
  );
}
