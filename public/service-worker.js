importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const SW_VERSION = '1.0.0';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Let Workbox clean up old precaches
      workbox.precaching.cleanupOutdatedCaches();

      // Define current runtime caches
      const currentRuntimeCaches = new Set([
        'app-shell-pages',
        'api-cache',
        'static-assets',
      ]);

      // Get all cache keys
      const cacheNames = await caches.keys();

      // Delete any runtime caches that are not in the current set
      for (const cacheName of cacheNames) {
        if (!cacheName.startsWith('workbox-') && !currentRuntimeCaches.has(cacheName)) {
          await caches.delete(cacheName);
        }
      }

      // Claim any currently open clients
      await clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_HEALTH') {
    event.source.postMessage({ type: 'HEALTH_RESPONSE', version: SW_VERSION, status: 'running' });
  }
});

// This is the service worker script that will be injected with the manifest
// by the `injectManifest` build process.
workbox.precaching.precacheAndRoute([{"revision":"d39853392df80baef1a647a9b7a1d823","url":"index.html"},{"revision":"5e1a301e9b82c1cb08aea4148bd56100","url":"manifest.json"},{"revision":"9b03133961813737d54b542c430787df","url":"android/android-launchericon-96-96.png"},{"revision":"bc99234a4dd9c1e072e1f0153483bd72","url":"android/android-launchericon-72-72.png"},{"revision":"07ba8c5f5b00089222373d9c44425394","url":"android/android-launchericon-512-512.png"},{"revision":"685832cba81b7eb4e2c383eb4673a85e","url":"android/android-launchericon-48-48.png"},{"revision":"8ea05e15a927b893ca6fc8cdfd593373","url":"android/android-launchericon-192-192.png"},{"revision":"5a76c4bc8e553ceb63ba73b7280eb03b","url":"android/android-launchericon-144-144.png"}]);

// Register route for navigation requests (e.g., HTML files)
// Uses StaleWhileRevalidate strategy: serve from cache immediately, then update from network.
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'app-shell-pages', // Cache for HTML pages
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200], // Cache successful responses (0 for opaque, 200 for OK)
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50, // Limit the number of pages stored
        maxAgeSeconds: 24 * 60 * 60, // Cache pages for 1 day
      }),
    ],
  })
);

// Example: Register route for API calls (e.g., requests starting with /api/)
// Cache falling back to network, then cache.
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'), // Adjust this path as needed
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // Cache API responses for 5 minutes
      }),
    ],
  })
);

// Background Sync for POST requests to /api/data
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('sync-queue', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
});

workbox.routing.registerRoute(
  ({url, request}) =>
    url.pathname === '/api/data' && request.method === 'POST',
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  })
);

// Cache static assets like scripts, styles, and images
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Handle push events for Firebase Messaging
self.addEventListener('push', (event) => {
  let payload;
  try {
    // Attempt to parse the push payload as JSON
    payload = event.data.json();
  } catch (e) {
    console.error('Push payload is not valid JSON:', event.data);
    // Fallback or error handling for non-JSON payloads
    return;
  }

  const notificationTitle = payload.title || 'New Message';
  const notificationOptions = {
    body: payload.body,
    icon: 'logo192.png', // Ensure this icon is precached
    badge: 'logo192.png', // Ensure this badge icon is precached
    data: payload.data, // Pass data from the payload to the notification
    // You can add other notification options here, like actions, tag, etc.
  };

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close();

  const notificationData = clickedNotification.data;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        client.focus();
        return client.navigate(urlToOpen);
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// Global catch handler for failed routes
workbox.routing.setCatchHandler(({ event }) => {
  switch (event.request.destination) {
    case 'document':
      // For failed navigation requests, return the precached app shell.
      return workbox.precaching.matchPrecache('/index.html');
    default:
      // For other failed requests, return a standard error response.
      return Response.error();
  }
});