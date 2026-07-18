// API layer between the React app and the DK Sites engine HTTP API (src/api/server.js).
// Set VITE_ENGINE_URL to the deployed API origin (e.g. https://api.dksites.com).
// If it's unset, the app falls back to MOCK data so it still runs standalone for demos.

const API = import.meta.env.VITE_ENGINE_URL || '';
const MOCK = !API;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body) {
  const r = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
  return r.json();
}
async function get(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
  return r.json();
}

export async function lookupBusiness(name, city) {
  if (MOCK) { await wait(900); return { name: name || "Riley's Hot Dog & Burger Gourmet", address: '61 Glen St, New Britain, CT', rating: 4.7, userRatingCount: 931, photo: 'https://picsum.photos/seed/riley/400/300' }; }
  return post('/api/lookup', { name, city });
}

// Generation is async: kick off a job, then poll until done. onStage fires per poll so the
// Generating screen can show live progress.
export async function generateSite(input, onStage) {
  if (MOCK) { await wait(1500); return { previewId: 'mock', slug: 'rileys', previewUrl: 'https://rileys.dksites.com/', decisions: {} }; }
  const { jobId } = await post('/api/generate', input);
  for (;;) {
    await wait(2500);
    const s = await get(`/api/status/${jobId}`);
    if (onStage && s.stage) onStage(s.stage, s.progress);
    if (s.status === 'done') return s.result;
    if (s.status === 'error') throw new Error(s.error || 'generation failed');
  }
}

export async function getEditOptions(previewId) {
  if (MOCK) { await wait(400); return { palette: { current: { dominant: '#C8111F', accent: '#F2C832' }, alternates: [{ label: 'Charcoal & Gold', dominant: '#1A1A1A', accent: '#E8C17A' }] }, fonts: { current: { display: 'Lilita One', body: 'Nunito' }, alternates: [{ label: 'Bold Slab', display: 'Alfa Slab One', body: 'Inter' }] }, suggestedPrompts: [{ type: 'menu_upload', label: 'Upload your menu (PDF/photo)' }, { type: 'feature', label: 'Add an online ordering button' }] }; }
  return get(`/api/edit-options/${previewId}`);
}

export async function applyEdit(previewId, change) {
  if (MOCK) { await wait(1200); return { version: 2 }; }
  return post('/api/apply-edit', { previewId, slug: change.slug || null, instruction: change.prompt || change.instruction || JSON.stringify(change) });
}

export async function checkDomain(domain) {
  if (MOCK) { await wait(700); const ai = domain.endsWith('.ai'); const dc = ai ? 89.98 : 13.98; const y = ai ? 2 : 1; const fee = +(0.3 * (dc + 99)).toFixed(2); return { domain, available: !domain.includes('taken'), years: y, lineItems: [{ label: `Domain (${y} yr)`, amount: dc }, { label: 'Hosting, SSL & email (1 yr)', amount: 99 }, { label: 'DK Sites service fee (30%)', amount: fee }], total: +(dc + 99 + fee).toFixed(2) }; }
  return get(`/api/check?domain=${encodeURIComponent(domain)}`);
}

export async function createCheckout(payload) {
  if (MOCK) { await wait(600); return { url: 'https://checkout.stripe.com/c/pay/mock' }; }
  return post('/api/checkout', payload);
}
