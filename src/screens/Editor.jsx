import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { getEditOptions, applyEdit, uploadFile } from '../api/engine.js';

// STAGED EDITOR
// Tapping a palette/font/suggestion no longer regenerates the site. Every choice is
// STAGED into a pending list the person can review and un-stage. One "Apply changes"
// sends the whole batch as a single edit — one generation, one cost, one coherent pass.
// Rationale: exploring is free; committing is the transaction.

const stageKey = (id) => `dksites-pending-${id || 'none'}`;
const dismissKey = (id) => `dksites-dismissed-${id || 'none'}`;

// What the owner can hand us that public data never has. These asks are the most valuable
// thing on the screen — a real logo fixes the palette, a real menu replaces placeholders —
// so they sit above everything else. They're also dismissable: nobody should be nagged.
const ASK_KINDS = [
  { kind: 'logo',  test: /logo/i,                 cta: 'Upload logo',   accept: 'image/*',
    done: 'Logo uploaded — palette will be rebuilt around it' },
  { kind: 'menu',  test: /menu|tap list/i,        cta: 'Upload menu',   accept: 'image/*,application/pdf',
    done: 'Menu uploaded — real items will replace the placeholders' },
  { kind: 'photo', test: /photo|picture|shot|gallery|hero/i, cta: 'Add photos', accept: 'image/*', multiple: true,
    done: 'Photos uploaded' },
];
const askKindFor = (text) => ASK_KINDS.find((k) => k.test.test(text || '')) || null;

export default function Editor({ go, project }) {
  const [opts, setOpts] = useState(null);
  const [pending, setPending] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [applying, setApplying] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const [dismissed, setDismissed] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Load options + restore any staged-but-unapplied changes from a previous visit.
  useEffect(() => {
    getEditOptions(project.previewId).then(setOpts);
    try {
      const saved = JSON.parse(localStorage.getItem(stageKey(project.previewId)));
      if (Array.isArray(saved)) setPending(saved);
    } catch {}
    try {
      const d = JSON.parse(localStorage.getItem(dismissKey(project.previewId)));
      if (Array.isArray(d)) setDismissed(d);
    } catch {}
  }, []);

  function save(next) {
    setPending(next);
    try { localStorage.setItem(stageKey(project.previewId), JSON.stringify(next)); } catch {}
  }

  // Stage a change. `kind` is unique-per-slot for palette/fonts (re-tapping replaces the
  // previous pick instead of stacking two contradictory palettes); prompts accumulate.
  function stage(kind, label, instruction, unique = false) {
    const entry = { id: `${kind}-${Date.now()}`, kind, label, instruction };
    save(unique ? [...pending.filter((p) => p.kind !== kind), entry] : [...pending, entry]);
  }

  const unstage = (id) => save(pending.filter((p) => p.id !== id));
  const stagedOf = (kind) => pending.find((p) => p.kind === kind);

  function dismiss(text) {
    const next = [...dismissed, text];
    setDismissed(next);
    try { localStorage.setItem(dismissKey(project.previewId), JSON.stringify(next)); } catch {}
  }

  // Uploads STAGE like every other change — the file goes to the server immediately (so it
  // survives a reload) but nothing regenerates until Apply, per the staged-editor rule.
  async function handleUpload(spec, fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(spec.kind);
    setUploadError(null);
    try {
      const recs = [];
      for (const f of files) recs.push(await uploadFile(project.previewId, spec.kind, f));
      const entry = {
        id: `${spec.kind}-${Date.now()}`,
        kind: spec.kind === 'photo' ? `photo-${Date.now()}` : spec.kind, // logos/menus replace; photos accumulate
        label: spec.kind === 'photo' ? `${recs.length} photo${recs.length > 1 ? 's' : ''} uploaded` : spec.done,
        instruction: null,
        upload: { kind: spec.kind, records: recs },
      };
      save(spec.kind === 'photo' ? [...pending, entry] : [...pending.filter((p) => p.kind !== spec.kind), entry]);
    } catch (e) {
      setUploadError(e.message || 'Upload failed.');
    }
    setUploading(null);
  }

  async function applyAll() {
    if (!pending.length) return;
    setApplying(true);
    const instruction = pending
      .filter((p) => p.instruction)
      .map((p, i) => `${i + 1}. ${p.instruction}`)
      .join('\n');
    const uploads = pending.filter((p) => p.upload);
    const logoFile = uploads.find((u) => u.upload.kind === 'logo')?.upload.records[0] || null;
    const menuFile = uploads.find((u) => u.upload.kind === 'menu')?.upload.records[0] || null;
    const photoFiles = uploads.filter((u) => u.upload.kind === 'photo').flatMap((u) => u.upload.records);
    try {
      await applyEdit(project.previewId, { instruction, slug: project.slug, logoFile, menuFile, photoFiles });
      save([]);
      // Re-read the options: the build now HAS the logo/menu/photos, so the server stops
      // reporting them as missing and those asks retire themselves.
      try { setOpts(await getEditOptions(project.previewId)); } catch {}
      setFrameKey((k) => k + 1); // redeployed — reload the live preview
    } catch (e) {
      alert(`Couldn't apply changes: ${e.message}`);
    }
    setApplying(false);
  }

  // ---- Applying: show the person their own decisions while they wait ----
  if (applying) {
    return (
      <div className="center container">
        <div className="spinner" />
        <h1>Applying your changes</h1>
        <p className="sub">Rebuilding your site with everything you picked. Usually 2–4 minutes.</p>
        <div className="stack" style={{ textAlign: 'left' }}>
          {pending.map((p) => (
            <div key={p.id} className="card" style={{ padding: '10px 14px' }}>
              <span style={{ color: 'var(--liquid-gold-bright)' }}>•</span> {p.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selPalette = stagedOf('palette')?.payload;

  // Asks come from triage (what the build is missing) plus the editor's own suggestions.
  const rawAsks = [
    ...(project.suggestedAsks || []),
    ...(opts?.suggestedPrompts || []).map((p) => p.label),
  ];
  // An ask is retired when the owner has already provided that thing — the server's
  // `provided` flags are the truth, not the asks captured back at generation time.
  const provided = opts?.provided || {};
  const satisfied = (ask) => {
    const spec = askKindFor(ask);
    if (!spec) return false;
    if (spec.kind === 'logo') return !!provided.logo;
    if (spec.kind === 'menu') return !!provided.menu;
    if (spec.kind === 'photo') return (provided.uploadedPhotos || 0) > 0;
    return false;
  };
  const asks = [...new Set(rawAsks)].filter((a) => a && !dismissed.includes(a) && !satisfied(a));

  return (
    <div className="container">
      {asks.length > 0 && (
        <section className="asks">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Make this site yours — {asks.length} thing{asks.length > 1 ? 's' : ''} I couldn't get on my own</p>
          <div className="asks__grid">
            {asks.map((ask) => {
              const spec = askKindFor(ask);
              const staged = spec && pending.some((p) => p.kind === spec.kind || p.kind.startsWith(`${spec.kind}-`));
              return (
                <div key={ask} className="ask">
                  <button className="ask__x" onClick={() => dismiss(ask)} aria-label="Dismiss">×</button>
                  <p className="ask__text">{ask}</p>
                  {spec ? (
                    staged ? (
                      <span className="ask__done">✓ Added to your changes</span>
                    ) : (
                      <label className="btn btn--gold ask__btn">
                        {uploading === spec.kind ? 'Uploading…' : spec.cta}
                        <input type="file" accept={spec.accept} multiple={!!spec.multiple} hidden
                          disabled={uploading === spec.kind}
                          onChange={(e) => handleUpload(spec, e.target.files)} />
                      </label>
                    )
                  ) : (
                    <button className="btn btn--ghost ask__btn"
                      onClick={() => { stage(`ask-${ask.slice(0, 20)}`, ask, ask, true); dismiss(ask); }}>
                      Add to changes
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {uploadError && <p className="ask__err">{uploadError}</p>}
        </section>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <h2>Your site — make it yours</h2>
        {project.previewUrl && (
          <a className="chip" href={project.previewUrl} target="_blank" rel="noreferrer">Open live preview ↗</a>
        )}
      </div>

      <div className="editor">
        {/* LEFT: the real generated site */}
        <div className="preview-frame">
          {project.previewUrl ? (
            <iframe key={frameKey} src={project.previewUrl} title="Your generated site"
              style={{ width: '100%', height: '100%', minHeight: 560, border: 0, display: 'block' }} />
          ) : (
            <div style={{ padding: 24, color: '#111' }}>No preview yet.</div>
          )}
        </div>

        {/* RIGHT: controls — every tap STAGES, nothing rebuilds until Apply */}
        <div>
          <p className="muted" style={{ marginTop: 0 }}>
            Pick as much as you like — nothing rebuilds until you hit <strong>Apply changes</strong>.
          </p>

          {!opts ? <p className="muted">Loading options…</p> : (
            <>
              <div className="zone">
                <h3>Colors</h3>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  {[opts.palette.current, ...opts.palette.alternates].map((p, i) => {
                    const on = selPalette ? selPalette.dominant === p.dominant : i === 0;
                    return (
                      <button key={i} title={p.label || 'Current'} onClick={() => {
                        const e = { id: `palette-${Date.now()}`, kind: 'palette', payload: p,
                          label: `Palette: ${p.label || 'current'}`,
                          instruction: `Change the color palette to dominant ${p.dominant} with accent ${p.accent}${p.label ? ` (${p.label})` : ''}.` };
                        save([...pending.filter((x) => x.kind !== 'palette'), e]);
                      }} style={{ display: 'flex', gap: 4, background: 'none', border: on ? '2px solid var(--liquid-gold-bright)' : '2px solid transparent', borderRadius: 10, padding: 3, cursor: 'pointer' }}>
                        <span className="swatch" style={{ background: p.dominant }} />
                        <span className="swatch" style={{ background: p.accent }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="zone">
                <h3>Fonts</h3>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  {[opts.fonts.current, ...opts.fonts.alternates].map((f, i) => (
                    <button key={i} className="chip"
                      style={{ borderColor: stagedOf('fonts')?.label?.includes(f.display) ? 'var(--liquid-gold-bright)' : undefined }}
                      onClick={() => stage('fonts', `Type: ${f.display} + ${f.body}`,
                        `Change the typography to ${f.display} for display/headings and ${f.body} for body text.`, true)}>
                      {f.display} + {f.body}
                    </button>
                  ))}
                </div>
              </div>

              {opts.suggestedPrompts.filter((sp) => !askKindFor(sp.label) && !dismissed.includes(sp.label)).length > 0 && (
                <div className="zone">
                  <h3>Suggested</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {opts.suggestedPrompts
                      .filter((sp) => !askKindFor(sp.label) && !dismissed.includes(sp.label))
                      .map((sp, i) => (
                        <button key={i} className="chip" style={{ textAlign: 'left' }}
                          onClick={() => stage(`sugg-${i}`, sp.label, sp.prompt || sp.label)}>+ {sp.label}</button>
                      ))}
                  </div>
                </div>
              )}

              <div className="zone">
                <h3>Ask for any change</h3>
                <textarea className="input" placeholder="e.g. Remove the pulsing ball at the end of the arc. Swap the mini golf card image for the outdoor course photo."
                  value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <Button variant="ghost" disabled={prompt.trim().length < 4}
                  onClick={() => { stage('prompt', prompt.trim(), prompt.trim()); setPrompt(''); }}>
                  Add to changes
                </Button>
              </div>
            </>
          )}

          {/* PENDING LIST — the staged batch, each removable */}
          <div className="zone">
            <h3>Pending changes {pending.length ? `(${pending.length})` : ''}</h3>
            {!pending.length ? (
              <p className="muted">Nothing staged yet. Your site stays exactly as it is.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {pending.map((p) => (
                  <span key={p.id} className="chip" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    {p.label}
                    <button onClick={() => unstage(p.id)} aria-label={`Remove ${p.label}`}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="price-bar" style={{ marginTop: 18, borderRadius: 'var(--radius)', gap: 12, flexWrap: 'wrap' }}>
        <span className="muted">
          {pending.length ? `${pending.length} change${pending.length > 1 ? 's' : ''} ready to apply` : 'Preview is free — edit as much as you like.'}
        </span>
        <div className="row" style={{ justifyContent: 'flex-end', margin: 0 }}>
          <Button variant="ghost" disabled={!pending.length} onClick={applyAll}>Apply changes</Button>
          <Button onClick={() => go('domain')}>Make it live →</Button>
        </div>
      </div>
    </div>
  );
}
