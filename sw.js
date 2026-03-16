const CACHE = 'gym-spa-v2';

const PRECACHE = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/fonts/inter-latin-400-normal.woff2',
  '/fonts/inter-latin-500-normal.woff2',
  '/fonts/inter-latin-600-normal.woff2',
  '/fonts/inter-latin-700-normal.woff2',
  '/fonts/sora-latin-400-normal.woff2',
  '/fonts/sora-latin-600-normal.woff2',
  '/fonts/sora-latin-700-normal.woff2',
  '/fonts/jetbrains-mono-latin-400-normal.woff2',
  '/fonts/playfair-display-latin-700-normal.woff2',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Fonts & Icons: Cache-first (static assets)
  if (url.pathname.includes('/fonts/') || url.pathname.includes('/icons/')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // index.html & manifest: Network-first, fallback to cache
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: cache then network
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
