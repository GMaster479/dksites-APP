// DK Sites Builder service worker. Its only jobs: make the app installable on phones, and
// show a friendly page instead of the browser's dinosaur when there's no connection.
// It never caches API calls or the app itself — every page load gets the latest version.
const OFFLINE = '/offline.html';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('dks-v1').then((c) => c.addAll([OFFLINE, '/icons/icon-192.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return; // only page loads; everything else goes straight through
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)));
});
