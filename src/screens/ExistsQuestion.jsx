export default function ExistsQuestion({ go }) {
  return (
    <div className="page">
      <h1>Is your business already on Google?</h1>
      <p className="sub">If it is, we can pull in your hours, reviews and photos, so there’s barely any typing.</p>
      <div className="stack">
        <button className="choice" onClick={() => go('confirm')}>
          <strong>Yes, we’re already open</strong>
          <span>Find us on Google and build from what’s already there.</span>
        </button>
        <button className="choice" onClick={() => go('describe')}>
          <strong>No, we’re new or not on Google yet</strong>
          <span>I’ll describe the business and you’ll design it from scratch.</span>
        </button>
      </div>
    </div>
  );
}
