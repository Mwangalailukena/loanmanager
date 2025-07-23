// public/service-worker.js
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

clientsClaim();

// Precache all assets generated during build
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up outdated caches automatically
cleanupOutdatedCaches();

// Cache navigation requests with network fallback for SPA routing
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 3,
    plugins: []
  })
);

// Cache JS/CSS files with stale-while-revalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Cache images with stale-while-revalidate
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
  })
);

// Optional: Cache API calls (Firestore offline persistence covers most)
// registerRoute(
//   ({ url }) => url.origin === 'https://firestore.googleapis.com',
//   new NetworkFirst()
// );

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

