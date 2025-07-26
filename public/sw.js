// public/sw.js

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('✅ Workbox loaded');

  // Precache files injected by Workbox during build (e.g. from manifest)
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Cache CSS/JS files from CDN or app shell
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Cache images with Cache First strategy
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
        }),
      ],
    })
  );

  // Fallback page when offline
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return Response.error();
  });

  // Offline fallback page (put this in your public/ folder)
  workbox.precaching.precacheAndRoute([
    { url: '/offline.html', revision: '1' },
  ]);
} else {
  console.log('❌ Workbox failed to load');
}

