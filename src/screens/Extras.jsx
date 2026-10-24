import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { uploadFile, findSocials, newDraftId } from '../api/engine.js';

// "Add your logo and photos" — between finding the business and building it.
// Everything here is optional, but a real logo sets the colors and real photos beat
// whatever Google happens to have, so it's the single biggest boost to the first draft.
// Social links feed the site's footer icons AND the JSON-LD "sameAs" (Google uses that to
// tie the website to the business's profiles).

const SLOTS = [
  { key: 'logo', kind: 'logo', title: 'Your logo', help: 'We’ll match the site’s colors to it.', note: null },
  { key: 'outside', kind: 'photo', title: 'A photo of the outside', help: 'Storefront, sign, building or truck. Helps people find you.', note: 'Outside of the business' },
  { key: 'inside', kind: 'photo', title: 'A photo of the inside or your work', help: 'Your space, your food, your team, or a job you’re proud of.', note: 'Inside the business / our work' },
];

// Platform fields. People type handles, links, or "facebook.com/x" — all are accepted.
const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', host: 'facebook.com', placeholder: 'facebook.com/yourbusiness' },
  { key: 'instagram', label: 'Instagram', host: 'instagram.com', placeholder: '@yourbusiness' },
  { key: 'tiktok', label: 'TikTok', host: 'tiktok.com', placeholder: '@yourbusiness', at: true },
  { key: 'yelp', label: 'Yelp', host: 'yelp.com', placeholder: 'yelp.com/biz/your-business' },
];
const HOST_KEY = [
  [/facebook\.com|fb\.com/i, 'facebook'], [/instagram\.com/i, 'instagram'], [/tiktok\.com/i, 'tiktok'], [/yelp\.com/i, 'yelp'],
];

export function toProfileUrl(platform, raw) {
  let v = String(raw || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.)?[a-z0-9-]+\.(com|net)\//i.test(v)) return `https://${v.replace(/^www\./, 'www.')}`;
  v = v.replace(/^@/, '').replace(/\s+/g, '');
  if (!/^[\w.-]{2,}$/.test(v)) return null;
  const p = PLATFORMS.find((x) => x.key === platform);
  if (!p) return null;
  if (platform === 'tiktok') return `https://www.tiktok.com/@${v}`;
  if (platform === 'yelp') return `https://www.yelp.com/biz/${v}`;
  return `https://www.${p.host}/${v}`;
}

export default function Extras({ go, project, patch }) {
  const draftId = useMemo(() => project.draftId || newDraftId(), []);
  // Save the draft id right away, so uploads survive going back or reloading the page.
  useEffect(() => { if (!project.draftId) patch?.({ draftId }); }, []);
  const [files, setFiles] = useState(() => ({ ...(project.extraFiles || {}) })); // key -> { assetPath, preview, name }
  const [more, setMore] = useState(() => project.extraMore || []);                 // [{ assetPath, preview }]
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [social, setSocial] = useState(() => project.socialFields || { facebook: '', instagram: '', tiktok: '', yelp: '', other: '' });
  const [found, setFound] = useState([]);
  const [looking, setLooking] = useState(false);

  // Pre-fill social links from their current website, if Google knows it.
  useEffect(() => {
    const site = project.business?.facts?.identity?.website || project.business?.website || project.website;
    if (!site || project.socialFields) return;
    setLooking(true);
    findSocials(site).then(({ socials = [] }) => {
      setFound(socials);
      setSocial((s) => {
        const next = { ...s };
        const others = [];
        for (const url of socials) {
          const hit = HOST_KEY.find(([re]) => re.test(url));
          if (hit && !next[hit[1]]) next[hit[1]] = url;
          else if (!hit) others.push(url);
        }
        if (others.length && !next.other) next.other = others.join('\n');
        return next;
      });
    }).finally(() => setLooking(false));
  }, []);

  async function pick(slot, fileList) {
    const f = fileList?.[0];
    if (!f) return;
    setBusy(slot.key); setErr(null);
    try {
      const rec = await uploadFile(draftId, slot.kind, f);
      setFiles((x) => ({ ...x, [slot.key]: { assetPath: rec.assetPath, preview: URL.createObjectURL(f), name: f.name } }));
    } catch (e) { setErr(e.message || 'That upload didn’t work. Try a different photo.'); }
    setBusy(null);
  }

  async function pickMore(fileList) {
    const list = Array.from(fileList || []).slice(0, 8);
    if (!list.length) return;
    setBusy('more'); setErr(null);
    try {
      const recs = [];
      for (const f of list) {
        const rec = await uploadFile(draftId, 'photo', f);
        recs.push({ assetPath: rec.assetPath, preview: URL.createObjectURL(f) });
      }
      setMore((m) => [...m, ...recs].slice(0, 9));
    } catch (e) { setErr(e.message || 'One of those uploads didn’t work.'); }
    setBusy(null);
  }

  const socials = [
    ...PLATFORMS.map((p) => toProfileUrl(p.key, social[p.key])),
    ...String(social.other || '').split(/[\s,]+/).map((x) => toProfileUrl('other', x)),
  ].filter(Boolean);

  const uploads = [
    ...SLOTS.filter((s) => files[s.key]).map((s) => ({ kind: s.kind, assetPath: files[s.key].assetPath, note: s.note })),
    ...more.map((m) => ({ kind: 'photo', assetPath: m.assetPath, note: null })),
  ];
  const added = uploads.length + socials.length;

  function build() {
    go('generating', {
      draftId, uploads, socials,
      // kept so Back returns to a filled-in form
      extraFiles: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, { assetPath: v.assetPath, name: v.name }])),
      extraMore: more.map((m) => ({ assetPath: m.assetPath })),
      socialFields: social,
    });
  }

  const name = project.business?.name;
  return (
    <div className="page">
      <h1>Make it look like {name ? name : 'your business'}</h1>
      <p className="sub">All optional. Your own logo and photos make the first version look much more like you. Skip anything you don’t have handy; you can add it later.</p>

      <section className="stack" aria-labelledby="ph">
        <h2 id="ph">Logo and photos</h2>
        {SLOTS.map((slot) => {
          const f = files[slot.key];
          return (
            <label key={slot.key} className="drop">
              <input type="file" accept="image/*" disabled={busy === slot.key} onChange={(e) => pick(slot, e.target.files)} />
              <span className={`drop__thumb ${slot.kind === 'logo' ? 'drop__thumb--logo' : ''}`}>
                {f?.preview ? <img src={f.preview} alt="" /> : f ? '✓' : '+'}
              </span>
              <span className="drop__text">
                <strong>{busy === slot.key ? 'Uploading…' : f ? `${slot.title}: added` : slot.title}</strong>
                <span>{f ? 'Tap to choose a different one.' : slot.help}</span>
              </span>
              {f && (
                <button type="button" className="drop__clear"
                  onClick={(e) => { e.preventDefault(); setFiles((x) => { const n = { ...x }; delete n[slot.key]; return n; }); }}>
                  Remove
                </button>
              )}
            </label>
          );
        })}
        <label className="drop">
          <input type="file" accept="image/*" multiple disabled={busy === 'more'} onChange={(e) => pickMore(e.target.files)} />
          <span className="drop__thumb">+</span>
          <span className="drop__text">
            <strong>{busy === 'more' ? 'Uploading…' : more.length ? `${more.length} more photo${more.length > 1 ? 's' : ''} added` : 'More photos'}</strong>
            <span>Products, food, past jobs, events. Pick several at once.</span>
          </span>
        </label>
        {more.some((m) => m.preview) && (
          <div className="thumbs">{more.filter((m) => m.preview).map((m) => <img key={m.assetPath} src={m.preview} alt="" />)}</div>
        )}
        {err && <p className="ask__err" role="alert">{err}</p>}
      </section>

      <section className="stack" aria-labelledby="so">
        <h2 id="so">Where else people find you</h2>
        <p className="muted" style={{ margin: '-6px 0 0' }}>
          {looking ? 'Checking your current website for links…'
            : found.length ? `We found ${found.length} on your current website. Check they’re right and add any that are missing.`
              : 'Add the pages you use. They show up as icons on your site and help Google connect your site to your profiles.'}
        </p>
        {PLATFORMS.map((p) => (
          <div className="field" key={p.key}>
            <label htmlFor={`s-${p.key}`}>{p.label}</label>
            <input id={`s-${p.key}`} className="input" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder={p.placeholder} value={social[p.key]}
              onChange={(e) => setSocial((s) => ({ ...s, [p.key]: e.target.value }))} />
          </div>
        ))}
        <div className="field">
          <label htmlFor="s-other">Any others <span className="hint">YouTube, X, LinkedIn, Google, TripAdvisor. Paste the full links.</span></label>
          <textarea id="s-other" className="input" style={{ minHeight: 70 }} autoCapitalize="off" spellCheck={false}
            placeholder="https://www.youtube.com/@yourbusiness" value={social.other}
            onChange={(e) => setSocial((s) => ({ ...s, other: e.target.value }))} />
        </div>
      </section>

      <div className="stack">
        <Button onClick={build} disabled={!!busy}>{added ? 'Build my site' : 'Skip and build my site'}</Button>
        <p className="muted" style={{ margin: 0 }}>Building takes about 3 to 5 minutes.</p>
      </div>
    </div>
  );
}
