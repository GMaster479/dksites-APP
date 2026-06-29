import { useEffect, useState } from 'react';
import { Button } from '../components/Bits.jsx';
import { getEditOptions, applyEdit } from '../api/engine.js';

// The editor: live preview on the left, three control zones on the right.
//  A) palette + font alternates (tap to apply)
//  B) suggested prompts (menu upload, confirmations, feature ideas)
//  C) free-text prompt for any other change
// Plus "Edit content" mode: direct in-place editing of TEXT and IMAGES only — everything
// structural stays prompt-only. In production the real site loads in an <iframe>; the same
// data-editable markers the generator adds drive which elements become editable.
export default function Editor({ go, project }) {
  const [opts, setOpts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [contentMode, setContentMode] = useState(false);
  const [prompt, setPrompt] = useState('');

  useEffect(() => { getEditOptions().then(setOpts); }, []);

  async function edit(change) {
    setBusy(true);
    await applyEdit(project.previewId, change);
    setBusy(false);
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2>Your site — make it yours</h2>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0, cursor: 'pointer' }}>
          <input type="checkbox" checked={contentMode} onChange={(e) => setContentMode(e.target.checked)} />
          Edit text &amp; images
        </label>
      </div>

      <div className="editor">
        {/* LEFT: preview. Stand-in DOM demonstrates in-place editing; prod uses an iframe. */}
        <div className="preview-frame">
          <MockSite editable={contentMode} />
        </div>

        {/* RIGHT: the three control zones */}
        <div>
          {!opts ? <p className="muted">Loading options…</p> : (
            <>
              <div className="zone">
                <h3>Colors</h3>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  {[opts.palette.current, ...opts.palette.alternates].map((p, i) => (
                    <div key={i} title={p.label || 'Current'} onClick={() => edit({ setPalette: p })} style={{ display: 'flex', gap: 4 }}>
                      <span className="swatch" style={{ background: p.dominant }} />
                      <span className="swatch" style={{ background: p.accent }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="zone">
                <h3>Fonts</h3>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  {[opts.fonts.current, ...opts.fonts.alternates].map((f, i) => (
                    <button key={i} className="chip" onClick={() => edit({ setFonts: f })}>{f.display} + {f.body}</button>
                  ))}
                </div>
              </div>

              <div className="zone">
                <h3>Suggested</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {opts.suggestedPrompts.map((s, i) => (
                    <button key={i} className="chip" style={{ textAlign: 'left' }} onClick={() => edit({ prompt: s.label })}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div className="zone">
                <h3>Ask for any change</h3>
                <textarea className="input" placeholder="e.g. Make the hero darker and add a section about catering" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <Button variant="ghost" disabled={busy || prompt.trim().length < 4} onClick={() => { edit({ prompt }); setPrompt(''); }} >{busy ? 'Applying…' : 'Apply change'}</Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="price-bar" style={{ marginTop: 18, borderRadius: 'var(--radius)' }}>
        <span className="muted">Ready when you are — preview is free.</span>
        <Button onClick={() => go('domain')}>Make it live →</Button>
      </div>
    </div>
  );
}

// A tiny stand-in for the generated site. Text nodes + images are flagged data-editable;
// in "content" mode they become directly editable. Structure is never touched here.
function MockSite({ editable }) {
  return (
    <div style={{ fontFamily: 'system-ui' }}>
      <div style={{ background: '#C8111F', color: '#fff', padding: '28px 20px' }}>
        <h2 contentEditable={editable} suppressContentEditableWarning style={{ fontFamily: 'Georgia', margin: 0, color: '#fff' }} data-editable>
          Riley's Hot Dog &amp; Burger Gourmet
        </h2>
        <p contentEditable={editable} suppressContentEditableWarning style={{ margin: '6px 0 0' }} data-editable>
          Gourmet Dogs. Outrageous Burgers. Zero Pretense.
        </p>
      </div>
      <div className="editable-img" style={{ height: 150, background: `url(https://picsum.photos/seed/dog/600/200) center/cover` }} title="Click to replace" />
      <div style={{ padding: 20 }}>
        <p contentEditable={editable} suppressContentEditableWarning data-editable>
          Made-to-order dogs and burgers, hand-cut fries, and 19+ rotating CT craft beers.
        </p>
      </div>
    </div>
  );
}
