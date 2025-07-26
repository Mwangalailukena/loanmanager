importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('✅ Workbox loaded');

  // Your existing caching setup
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // Background Sync plugin for POST requests
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('postQueue', {
    maxRetentionTime: 24 * 60, // Retry for max of 24 hours
  });

  workbox.routing.registerRoute(
    ({ url, request }) =>
      request.method === 'POST' &&
      url.pathname.startsWith('/api/'), // Adjust this to your API path
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin],
    }),
    'POST'
  );

  // Offline fallback page
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return Response.error();
  });

  workbox.precaching.precacheAndRoute([{ url: '/offline.html', revision: '1' }]);

} else {
  console.log('❌ Workbox failed to load');
}

