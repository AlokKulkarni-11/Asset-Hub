const CACHE_NAME = 'assethub-v1';
const API_CACHE_NAME = 'assethub-api-v1';

const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/AssetHub_Logo.png',
  '/AssetHub_Name.png',
  '/AssetHub.png',
  '/favicon.svg'
];

// Install Event - Precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME)
          .map((caheName) => caches.delete(caheName))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Scratch Network-First for API & Navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Disregard non-GET requests and non-http(s) schemes (e.g. chrome-extension://)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle API GET requests (portfolio data, snapshots, etc.)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const cloned = response.cloneToCache ? response.cloneToCache() : response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached API data when offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({ error: 'Offline' }), {
              status: 535,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle Static Assets & Navigation Shell
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            return caches.match('index.html') || caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
