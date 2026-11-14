import { useEffect, useState } from 'react';
import { Button, Confirm } from './Bits.jsx';
import { metaAvailable, metaConnection, metaChoosePage, metaRefresh, metaDisconnect, metaStartUrl } from '../api/engine.js';

// Connect Facebook + Instagram. We only READ: Page info, the linked Instagram, recent posts.
//
// mode="extras": before the first build. Connecting is all there is to do — the build picks
//   up their description, hours (if Google has none), links and best photos by itself.
// mode="editor": on an existing site. Each use is STAGED like any other change (links,
//   their own words, chosen photos, the latest-posts feed), so nothing happens until
//   they press "Update my site".
//
// Until Meta approves the app, the server only says "enabled" for admins and testers, so
// everyone else never sees this panel.

const fmtAgo = (t) => {
  if (!t) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} hour${h > 1 ? 's' : ''} ago` : `${Math.round(h / 24)} day${h >= 48 ? 's' : ''} ago`;
};

export default function SocialConnect({ previewId, mode = 'editor', ensureId, pending = [], onStage, onUnstage }) {
  const [avail, setAvail] = useState(null);
  const [c, setC] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);
  const [picked, setPicked] = useState([]);
  const [confirmOff, setConfirmOff] = useState(false);

  useEffect(() => { metaAvailable().then(setAvail); }, []);
  useEffect(() => {
    if (!avail?.enabled || !previewId) return;
    metaConnection(previewId).then(setC).catch((e) => setErr(e.message));
  }, [avail?.enabled, previewId]);

  if (!avail?.enabled) return null;

  const connect = () => {
    const id = previewId || ensureId?.();
    if (id) window.location.href = metaStartUrl(id, mode === 'extras' ? 'extras' : 'editor');
  };
  const run = async (key, fn) => {
    setBusy(key); setErr(null);
    try { const r = await fn(); if (r) setC(r); } catch (e) { setErr(e.message || 'That didn’t work.'); }
    setBusy(null);
  };

  const staged = (kind) => pending.find((p) => p.kind === kind);
  const stageBtn = (kind, label, meta, text) => staged(kind) ? (
    <span className="social__done">✓ Added to your changes <button className="link" onClick={() => onUnstage?.(staged(kind).id)}>Undo</button></span>
  ) : (
    <Button variant="ghost" onClick={() => onStage?.({ id: `${kind}-${Date.now()}`, kind, label, instruction: null, meta })}>{text}</Button>
  );

  // ---- not connected yet ----
  if (!c || (!c.connected && !c.choosing?.length)) {
    return (
      <div className="social card">
        <div className="social__head">
          <span className="social__logos" aria-hidden="true">f · ◎</span>
          <div>
            <strong>Connect your Facebook and Instagram</strong>
            <p className="muted">
              {mode === 'extras'
                ? 'We’ll read how you describe your business, your hours and your best recent photos, and build them in.'
                : 'Use your own description and photos on your site, and show your latest posts.'}
              {' '}We only read your Page. We never post anything.
            </p>
          </div>
        </div>
        {avail.testing && <p className="social__test">Testing mode: only works for Facebook accounts added to the DK Sites app.</p>}
        <Button onClick={connect}>Connect Facebook</Button>
        {err && <p className="ask__err">{err}</p>}
      </div>
    );
  }

  // ---- they manage several Pages: which one is this business? ----
  if (!c.connected && c.choosing?.length) {
    return (
      <div className="social card">
        <strong>Which Page is this business?</strong>
        <div className="social__pages">
          {c.choosing.map((p) => (
            <button key={p.id} className="card card--tap social__page" disabled={!!busy}
              onClick={() => run(p.id, () => metaChoosePage(previewId, p.id))}>
              {p.picture ? <img src={p.picture} alt="" referrerPolicy="no-referrer" /> : <span className="social__ph" />}
              <span><strong>{busy === p.id ? 'Connecting…' : p.name}</strong>
                <span className="muted">{[p.category, p.instagram?.username && `@${p.instagram.username}`].filter(Boolean).join(' · ')}</span></span>
            </button>
          ))}
        </div>
        {err && <p className="ask__err">{err}</p>}
      </div>
    );
  }

  // ---- connected ----
  const photos = (c.posts || []).filter((p) => !p.video);
  const togglePick = (id) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id].slice(0, 8)));
  return (
    <div className="social card">
      <div className="social__head">
        {c.page?.picture ? <img className="social__avatar" src={c.page.picture} alt="" referrerPolicy="no-referrer" /> : <span className="social__ph" />}
        <div>
          <strong>{c.page?.name || 'Your Page'}</strong>
          <p className="muted">
            {[c.page?.link && 'Facebook', c.instagram?.username && `Instagram @${c.instagram.username}`].filter(Boolean).join(' · ')}
            {c.fetchedAt ? ` · checked ${fmtAgo(c.fetchedAt)}` : ''}
          </p>
        </div>
      </div>

      {c.needsReconnect && (
        <div className="alert" style={{ marginTop: 12 }}>
          <strong>Facebook ended this connection.</strong>
          <p className="muted" style={{ margin: '4px 0 10px' }}>That happens after a password change or if access was removed. Connect again to keep things up to date.</p>
          <Button variant="ghost" onClick={connect}>Connect again</Button>
        </div>
      )}

      {mode === 'extras' ? (
        <p className="muted" style={{ margin: '12px 0 0' }}>
          ✓ Connected. We’ll use {[c.found?.description && 'how you describe yourselves', c.found?.hours && 'your hours if Google doesn’t have them', 'your links', c.found?.photos && `your best ${Math.min(6, c.found.photos)} recent photos`].filter(Boolean).join(', ')} when we build.
        </p>
      ) : (
        <div className="social__uses">
          <div className="social__use">
            <div><strong>Your Facebook and Instagram links</strong><span className="muted">As icons on your site, and so Google connects your site to your pages.</span></div>
            {stageBtn('meta-socials', 'Add Facebook & Instagram links', { socials: true }, 'Add the links')}
          </div>

          {c.about && (
            <div className="social__use">
              <div>
                <strong>How you describe yourselves</strong>
                <blockquote className="social__quote">{c.about}</blockquote>
                <span className="muted">Updates your intro and about text to match. Nothing else changes.</span>
              </div>
              {stageBtn('meta-info', 'Use our Facebook description', { useInfo: true }, 'Use this')}
            </div>
          )}

          <div className="social__use">
            <div>
              <strong>{c.feedOn ? 'Your latest posts are on your site' : 'Show your latest posts on your site'}</strong>
              <span className="muted">{c.feedOn ? 'They update every night on their own.' : 'A section with your 6 newest photo posts. Updates every night on its own. Photos are copied to your site, so it never breaks.'}</span>
            </div>
            {c.feedOn
              ? stageBtn('meta-removefeed', 'Remove the latest posts section', { removeFeed: true }, 'Remove it')
              : stageBtn('meta-feed', 'Show our latest posts', { feed: true }, 'Add it')}
          </div>

          {photos.length > 0 && (
            <div className="social__use social__use--col">
              <div><strong>Use your photos on the site</strong><span className="muted">Tap the ones you like. They go where they fit best, replacing weaker photos.</span></div>
              <div className="social__grid">
                {photos.slice(0, 12).map((p) => (
                  <button key={p.id} type="button" className={`social__pic ${picked.includes(p.id) ? 'social__pic--on' : ''}`}
                    aria-pressed={picked.includes(p.id)} onClick={() => togglePick(p.id)} title={p.caption || ''}>
                    <img src={p.image} alt={p.caption ? p.caption.slice(0, 80) : 'Post photo'} loading="lazy" referrerPolicy="no-referrer" />
                    {picked.includes(p.id) && <span className="social__tick" aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
              {staged('meta-photos') ? stageBtn('meta-photos') : (
                <Button variant="ghost" disabled={!picked.length}
                  onClick={() => { onStage?.({ id: `meta-photos-${Date.now()}`, kind: 'meta-photos', label: `${picked.length} photo${picked.length > 1 ? 's' : ''} from Facebook/Instagram`, instruction: null, meta: { photoIds: picked } }); setPicked([]); }}>
                  {picked.length ? `Use ${picked.length} photo${picked.length > 1 ? 's' : ''}` : 'Pick photos above'}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="social__foot">
        <button className="link" disabled={!!busy} onClick={() => run('refresh', () => metaRefresh(previewId))}>{busy === 'refresh' ? 'Checking…' : 'Check for new posts'}</button>
        <button className="link" onClick={() => setConfirmOff(true)}>Disconnect</button>
      </div>
      {err && <p className="ask__err">{err}</p>}

      {confirmOff && (
        <Confirm title="Disconnect Facebook?" yes="Disconnect" onNo={() => setConfirmOff(false)}
          onYes={() => { setConfirmOff(false); run('off', async () => { await metaDisconnect(previewId); return { ...avail, connected: false }; }); }}>
          <p style={{ margin: 0 }}>We’ll stop reading your Page and delete what we saved from it.</p>
          {c.feedOn && <p className="muted" style={{ margin: '10px 0 0' }}>The latest posts section on your site will hide itself.</p>}
        </Confirm>
      )}
    </div>
  );
}
