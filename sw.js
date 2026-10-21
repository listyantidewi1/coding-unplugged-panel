// Offline support: cache the app shell so a panel keeps working when the
// school network drops. Bump VERSION whenever files change.
const VERSION = 'cu-v1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'css/app.css',
  'js/app.js',
  'js/core/util.js',
  'js/core/sound.js',
  'js/core/session.js',
  'js/activities/registry.js',
  'js/activities/paud-01-pola.js',
  'js/activities/sda-09-gambar-rahasia.js',
  'js/activities/bit-sum.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first so updates show up, cache as fallback when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
