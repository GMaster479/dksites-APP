// API layer between the React app and the DK Sites engine (the Node pipeline).
// Each function is stubbed with realistic mock data so the app runs standalone.
// To go live, replace each body with a fetch to the engine's HTTP API and set
// VITE_ENGINE_URL. Shapes mirror what the engine already produces.

const API = import.meta.env.VITE_ENGINE_URL || ''; // e.g. https://engine.dksites.com
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Step 3a: resolve a business from public data (Google Places in the engine).
export async function lookupBusiness(name, city) {
  // TODO: return fetch(`${API}/lookup?name=${...}&city=${...}`).then(r=>r.json())
  await wait(900);
  return {
    placeId: 'mock',
    name: name || "Riley's Hot Dog & Burger Gourmet",
    address: '61 Glen St, New Britain, CT 06051',
    rating: 4.7,
    userRatingCount: 931,
    photo: 'https://picsum.photos/seed/riley/400/300',
  };
}

// Step 4: run the generation pipeline -> a deployed preview.
export async function generateSite(input) {
  // TODO: POST `${API}/generate` with the confirmed business / description.
  await wait(1500);
  return {
    previewId: 'mock-preview-id',
    slug: 'rileys',
    previewUrl: 'https://rileys.dksites.com/',
    decisions: {
      palette: { dominant: '#C8111F', accent: '#F2C832' },
      typography: { display: 'Lilita One', body: 'Nunito' },
      signature: 'Mustard-squiggle dividers',
    },
  };
}

// Step 5: editor options (Zones A + B) from the engine's buildEditOptions.
export async function getEditOptions() {
  await wait(400);
  return {
    palette: {
      current: { dominant: '#C8111F', accent: '#F2C832' },
      alternates: [
        { label: 'Classic Diner', dominant: '#B5121B', accent: '#F4C542' },
        { label: 'Charcoal & Gold', dominant: '#1A1A1A', accent: '#E8C17A' },
      ],
    },
    fonts: {
      current: { display: 'Lilita One', body: 'Nunito' },
      alternates: [
        { label: 'Bold Slab', display: 'Alfa Slab One', body: 'Inter' },
        { label: 'Retro', display: 'Bungee', body: 'DM Sans' },
      ],
    },
    suggestedPrompts: [
      { type: 'menu_upload', label: 'Upload your menu (PDF/photo) to replace placeholders' },
      { type: 'confirm', label: 'Are you family-owned? Confirm and I’ll add it.' },
      { type: 'feature', label: 'Add an online ordering button' },
    ],
  };
}

// Step 5 (Zone C / structured picks): apply an edit and regenerate in place.
export async function applyEdit(previewId, change) {
  await wait(1200);
  return { ok: true, version: 2 };
}

// Step 7: domain availability + verified quote (the engine's --check).
export async function checkDomain(domain) {
  // TODO: GET `${API}/check?domain=${domain}`
  await wait(700);
  const taken = domain.includes('taken');
  const isAi = domain.endsWith('.ai');
  const domainCost = isAi ? 89.98 : 13.98;
  const years = isAi ? 2 : 1;
  const hosting = 99, fee = +(0.3 * (domainCost + hosting)).toFixed(2);
  return {
    domain, available: !taken, years,
    lineItems: [
      { label: `Domain (${years} yr)`, amount: domainCost },
      { label: 'Hosting, SSL & email (1 yr)', amount: hosting },
      { label: 'DK Sites service fee (30%)', amount: fee },
    ],
    total: +(domainCost + hosting + fee).toFixed(2),
  };
}

// Step 9: create a Stripe Checkout session (engine's createCheckout).
export async function createCheckout(payload) {
  await wait(600);
  return { url: 'https://checkout.stripe.com/c/pay/mock_session' };
}
