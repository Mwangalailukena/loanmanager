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
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

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
  let notificationTitle = 'New Notification';
  let notificationBody = 'You have a new message.';
  let notificationData = {}; // For notificationclick event

  if (event.data) {
    try {
      // Attempt to parse as JSON
      const parsedData = event.data.json();
      notificationTitle = parsedData.title || notificationTitle;
      notificationBody = parsedData.body || notificationBody;
      notificationData = parsedData.data || notificationData; // Pass original data for click handler
    } catch (e) {
      // If not JSON, treat as plain text
      notificationBody = event.data.text() || notificationBody;
    }
  }

  const notificationOptions = {
    body: notificationBody,
    icon: 'logo192.png',
    badge: 'logo192.png',
    data: notificationData, // Ensure data is passed
    tag: notificationData.tag || 'default-notification-tag', // Use a tag to prevent stacking
    renotify: true, // Re-alert user if updated
    actions: [
      {
        action: 'open_app',
        title: 'Open App',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close(); // Always close the notification after interaction

  const notificationData = clickedNotification.data;
  const urlToOpen = notificationData?.url || '/';

  // Determine the action based on event.action or default to opening the app
  const actionToPerform = event.action || 'open_app'; // If no action button is clicked, treat as 'open_app'

  if (actionToPerform === 'open_app') {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      }).then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0]; // Prefer a focused client if available
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          client.focus();
          return client.navigate(urlToOpen);
        }
        return clients.openWindow(urlToOpen); // Open new window if no client is found
      })
    );
  } else if (actionToPerform === 'close') {
    // User clicked 'Close' button or dismissed notification, no further action needed
  }
  // Other actions can be added here
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