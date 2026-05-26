// HPSHOP Service Worker v1.0
const CACHE_NAME = 'hpshop-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/assets/logo.png',
  '/manifest.json'
];

// Install: pre-cache assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

// Activate: nettoyer les vieux caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch: cache-first pour assets, network-first pour le reste
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Don't intercept POST or non-http
  if (e.request.method !== 'GET') return;
  // Strategy: stale-while-revalidate for images and core assets
  if (ASSETS.some(a => url.pathname.endsWith(a)) || url.hostname.includes('unsplash') || url.hostname.includes('fonts')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(resp => {
            if (resp && resp.status === 200) cache.put(e.request, resp.clone());
            return resp;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
  }
});
