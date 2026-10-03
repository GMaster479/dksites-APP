import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { getAdminOverview, runReminders, apiUrl } from '../api/engine.js';

// Admin view (only for emails listed in ADMIN_EMAILS on the server). Who signed up, what
// sold, what renews soon, and the renewal-reminder controls.
const dateStr = (ms) =>
  ms ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—';
const money = (n) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');

export default function Admin({ user }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [rem, setRem] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => getAdminOverview().then(setData).catch((e) => setErr(e.message));
  useEffect(() => { if (user?.isAdmin) load(); }, [user?.id]);

  if (!user?.isAdmin) {
    return <div className="center container"><h1>Admins only</h1><p className="sub">This page is for DK Sites staff.</p></div>;
  }

  async function reminders(dryRun) {
    if (!dryRun && !window.confirm('Send every due renewal reminder now? Each site only ever gets each one once.')) return;
    setBusy(true); setErr(null);
    try { setRem(await runReminders(dryRun)); if (!dryRun) load(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const t = data?.totals;
  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <p className="eyebrow">Admin</p>
      <h1 style={{ marginBottom: 22 }}>Overview</h1>
      {err && <div className="alert"><strong>Error.</strong> <span className="muted">{err}</span></div>}
      {!data && !err && <div className="spinner" style={{ margin: '40px auto' }} />}

      {t && (
        <div className="stats">
          <div className="stat"><span className="stat__n">{t.users}</span><span className="muted">Accounts</span></div>
          <div className="stat"><span className="stat__n">{t.builds}</span><span className="muted">Claimed previews</span></div>
          <div className="stat"><span className="stat__n">{t.sites}</span><span className="muted">Paid sites</span></div>
          <div className="stat"><span className="stat__n">{money(t.revenue)}</span><span className="muted">Revenue</span></div>
          <div className="stat"><span className="stat__n">{t.renewingSoon}</span><span className="muted">Renewing ≤45 days</span></div>
        </div>
      )}

      <div className="card" style={{ marginTop: 22 }}>
        <h2>Renewal reminders</h2>
        <p className="muted" style={{ margin: '4px 0 12px' }}>
          Runs by itself every 12 hours. Each site gets a 30-day and a 7-day email, once each — renew at the same rate,
          or upgrade to a custom build with year two credited.
        </p>
        <div className="row" style={{ justifyContent: 'flex-start' }}>
          <Button variant="ghost" disabled={busy} onClick={() => reminders(true)}>See what’s due</Button>
          <Button disabled={busy} onClick={() => reminders(false)}>Send due reminders now</Button>
          <a className="chip" href={apiUrl('/api/admin/reminder-preview?days=30')} target="_blank" rel="noreferrer">Preview 30-day email</a>
          <a className="chip" href={apiUrl('/api/admin/reminder-preview?days=7&auto=1')} target="_blank" rel="noreferrer">Preview 7-day (auto-renew)</a>
        </div>
        {rem && (
          <div style={{ marginTop: 14 }}>
            <p className="muted" style={{ margin: '0 0 8px' }}>
              {rem.dryRun ? `${rem.reminders.length} due (nothing sent).` : `Sent ${rem.sent}.`}
            </p>
            {rem.reminders.map((r, i) => (
              <div key={i} className="muted" style={{ fontSize: '.82rem' }}>
                {r.error ? `✗ site ${r.siteId}: ${r.error}` : `${r.domain} → ${r.to} · ${r.which === 'reminder7_at' ? '7-day' : '30-day'} (${r.daysOut}d)`}
              </div>
            ))}
          </div>
        )}
      </div>

      {data && (
        <>
          <h2 style={{ marginTop: 30 }}>Paid sites</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Domain</th><th>Account</th><th>Paid</th><th>Renews</th><th>Auto</th><th>Own domain</th><th>Reminders</th></tr></thead>
              <tbody>
                {data.sites.length === 0 && <tr><td colSpan={7} className="muted">None yet.</td></tr>}
                {data.sites.map((s) => (
                  <tr key={s.id}>
                    <td><a href={`https://${s.domain}`} target="_blank" rel="noreferrer">{s.domain}</a></td>
                    <td>{s.email || '—'}</td>
                    <td>{money(s.amount)} · {dateStr(s.paidAt)}</td>
                    <td>{dateStr(s.renewsAt)}</td>
                    <td>{s.autoRenew ? 'Yes' : 'No'}</td>
                    <td>{s.ownDomain ? 'Yes' : 'No'}</td>
                    <td>{[s.reminder30At && '30d', s.reminder7At && '7d'].filter(Boolean).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 30 }}>Accounts</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Email</th><th>Name</th><th>Sign-in</th><th>Previews</th><th>Sites</th><th>Joined</th><th>Last seen</th></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td><td>{u.name || '—'}</td><td>{u.google ? 'Google' : 'Email link'}</td>
                    <td>{u.builds}</td><td>{u.sites}</td><td>{dateStr(u.created_at)}</td><td>{dateStr(u.last_login_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 30 }}>Claimed previews</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Account</th><th>Preview</th><th>Claimed</th></tr></thead>
              <tbody>
                {data.builds.length === 0 && <tr><td colSpan={4} className="muted">None yet.</td></tr>}
                {data.builds.map((b) => (
                  <tr key={b.previewId}>
                    <td>{b.name || b.slug || b.previewId}</td><td>{b.email}</td>
                    <td>{b.previewUrl ? <a href={b.previewUrl} target="_blank" rel="noreferrer">Open</a> : '—'}</td>
                    <td>{dateStr(b.claimedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
