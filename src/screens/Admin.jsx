import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { getAdminOverview, runReminders, apiUrl, retryLaunch, markLaunched, getBackups, backupNow } from '../api/engine.js';

// Admin view (only for emails listed in ADMIN_EMAILS on the server). Who signed up, what
// sold, what renews soon, and the renewal-reminder controls.
const dateStr = (ms) =>
  ms ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—';
const money = (n) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');
const when = (ms) => (ms ? new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
const LAUNCH_LABEL = {
  own_domain: 'Owner connects', starting: 'Starting', running: 'Running', done: 'Done',
  needs_attention: 'Needs attention', error: 'Failed',
};

export default function Admin({ user }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [rem, setRem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [backups, setBackups] = useState(null);
  const [backupBusy, setBackupBusy] = useState(false);

  const load = () => getAdminOverview().then(setData).catch((e) => setErr(e.message));
  const loadBackups = () => getBackups().then(setBackups).catch(() => {});
  useEffect(() => { if (user?.isAdmin) { load(); loadBackups(); } }, [user?.id]);

  async function retry(s) {
    const msg = s.registeredAt
      ? `Retry the launch for ${s.domain}? The domain is already registered — it will NOT be bought again.`
      : `Retry the launch for ${s.domain}? The domain is NOT registered yet, so this WILL buy it (real money if LAUNCH_LIVE=true).`;
    if (!window.confirm(msg)) return;
    try { await retryLaunch(s.id); setTimeout(load, 1500); } catch (e) { setErr(e.message); }
  }
  async function markDone(s) {
    if (!window.confirm(`Mark ${s.domain} as launched? Only do this after fixing it by hand (e.g. setting the nameservers at Namecheap).`)) return;
    try { await markLaunched(s.id); load(); } catch (e) { setErr(e.message); }
  }
  async function doBackup() {
    setBackupBusy(true); setErr(null);
    try { await backupNow(); await loadBackups(); } catch (e) { setErr(`Backup: ${e.message}`); }
    setBackupBusy(false);
  }

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

      <div className="card" style={{ marginTop: 22 }}>
        <h2>Database backups</h2>
        <p className="muted" style={{ margin: '4px 0 12px' }}>
          Every night around 3:30 AM the accounts database is copied to R2 ({backups?.bucket || '…'}/{backups?.prefix || 'backups/db/'}).
          30 days are kept there, 3 on the server.
        </p>
        <p style={{ margin: '0 0 12px' }}>
          {backups?.last
            ? <>Last backup: <strong>{when(backups.last.at)}</strong> · {(backups.last.bytes / 1024).toFixed(1)} KB · {backups.last.remoteCount} in R2</>
            : <span className="muted">No backup yet.</span>}
        </p>
        {backups?.error && (!backups.last || backups.error.at > backups.last.at) && (
          <div className="alert"><strong>Last attempt failed</strong> <span className="muted">{when(backups.error.at)} — {backups.error.message}</span></div>
        )}
        <Button variant="ghost" disabled={backupBusy} onClick={doBackup}>{backupBusy ? 'Backing up…' : 'Back up now'}</Button>
      </div>

      {data && (
        <>
          <h2 style={{ marginTop: 30 }}>Paid sites</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Domain</th><th>Account</th><th>Launch</th><th>Paid</th><th>Renews</th><th>Auto</th><th>Own domain</th><th>Reminders</th></tr></thead>
              <tbody>
                {data.sites.length === 0 && <tr><td colSpan={8} className="muted">None yet.</td></tr>}
                {data.sites.map((s) => (
                  <tr key={s.id}>
                    <td><a href={`https://${s.domain}`} target="_blank" rel="noreferrer">{s.domain}</a></td>
                    <td>{s.email || '—'}</td>
                    <td>
                      <span className={`pill ${s.launchStatus === 'error' ? 'pill--err' : s.launchStatus === 'needs_attention' ? 'pill--warn' : ''}`}>
                        {LAUNCH_LABEL[s.launchStatus] || s.launchStatus}
                      </span>
                      {s.launchError && <div className="muted" style={{ fontSize: '.78rem', marginTop: 4, maxWidth: 280 }}>{s.launchError}</div>}
                      {(s.launchStatus === 'error' || s.launchStatus === 'needs_attention') && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          <button className="chip" onClick={() => retry(s)}>Retry</button>
                          <button className="chip" onClick={() => markDone(s)}>Mark done</button>
                        </div>
                      )}
                    </td>
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
