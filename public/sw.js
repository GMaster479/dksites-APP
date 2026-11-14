// DK Sites Builder service worker. Its jobs: make the app installable on phones, show a
// friendly page instead of the browser's dinosaur when there's no connection, and show
// "your website was updated" notifications. It never caches API calls or the app itself —
// every page load gets the latest version.
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

// A finished edit (sent by api.dksites.com when nobody was watching the screen).
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'DK Sites', {
    body: d.body || 'Your website was updated.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: d.tag || 'dksites',
    renotify: true,
    data: { url: d.url || '/' },
  }));
});

// Tapping it opens the app on that site (reusing an open window if there is one).
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || '/', self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin === self.location.origin) {
        await w.focus();
        return w.navigate(target);
      }
    }
    return self.clients.openWindow(target);
  })());
});
