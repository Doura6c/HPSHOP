// HPSHOP Service Worker v2.0
// Stratégie : cache-first pour assets statiques, network-first pour HTML
const CACHE_NAME = 'hpshop-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/mentions-legales.html',
  '/politique-confidentialite.html',
  '/assets/logo.png',
  '/assets/og-image.jpg',
  '/manifest.json'
];

// Install : précacher les assets statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC_ASSETS))
      .catch(() => {}) // Ne pas bloquer l'install si un asset échoue
  );
  self.skipWaiting();
});

// Activate : supprimer les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch : stratégies différenciées selon le type de ressource
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // ① Webhook CRM — ne jamais intercepter (toujours réseau direct)
  if(url.hostname.includes('cod-crm-zeta')) return;

  // ② Images Unsplash — stale-while-revalidate
  if(url.hostname.includes('unsplash')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(resp => {
            if(resp && resp.status === 200) cache.put(e.request, resp.clone());
            return resp;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // ③ Google Fonts — cache-first (changent rarement)
  if(url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          if(cached) return cached;
          return fetch(e.request).then(resp => {
            if(resp && resp.status === 200) cache.put(e.request, resp.clone());
            return resp;
          });
        })
      )
    );
    return;
  }

  // ④ Assets statiques locaux (logo, og-image, manifest) — cache-first
  if(url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.json')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          if(cached) return cached;
          return fetch(e.request).then(resp => {
            if(resp && resp.status === 200) cache.put(e.request, resp.clone());
            return resp;
          });
        })
      )
    );
    return;
  }

  // ⑤ Pages HTML locales — network-first avec fallback cache offline
  if(url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if(resp && resp.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(e.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match('/')))
    );
    return;
  }
});
