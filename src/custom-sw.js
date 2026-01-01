importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const SW_VERSION = '1.0.0';

// Data URI for a simple 1x1 gray GIF placeholder image
const IMAGE_PLACEHOLDER_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

self.addEventListener('install', () => {
  // Removed self.skipWaiting() here. Activation will now wait until
  // all active clients are closed, or the client explicitly sends
  // a 'SKIP_WAITING' message (e.g., from an update prompt).
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

// Global error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Unhandled Promise Rejection:', event.reason);
  // In a production environment, you might send this to a remote logging service
  // e.g., myMonitoringService.logError(event.reason, 'unhandledrejection');
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
// This block will be replaced with consolidated API routing.

// Background Sync for offline POST requests
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('loanManagerQueue', {
  maxRetentionTime: 24 * 60, // Retry for a maximum of 24 hours
});

// Example Workbox plugin for cache monitoring
const cacheMonitorPlugin = {
  // Runs whenever a response is added to a cache
  cacheDidUpdate: async ({cacheName, request, oldResponse, newResponse}) => {
    if (newResponse) {
      console.log(`[Service Worker] Cache "${cacheName}" updated for: ${request.url}`);
      // In a production environment, you might send this event to a remote logging service
      // e.g., myMonitoringService.logCacheEvent('updated', cacheName, request.url);
    } else {
      console.log(`[Service Worker] Cache "${cacheName}" added for: ${request.url}`);
      // e.g., myMonitoringService.logCacheEvent('added', cacheName, request.url);
    }
  },
  // Optionally, you can add 'cacheWillUpdate' or 'cachedResponseWillBeUsed'
  // for more detailed monitoring like cache hits/misses, but that gets more complex.
};

// Consolidated API routes:

// 1. API calls (POST requests to /api/ with NetworkOnly + Background Sync)
workbox.routing.registerRoute(
  ({ url, request }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);

// 2. API calls (GET requests to /api/ with NetworkFirst)
workbox.routing.registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({ // Changed from StaleWhileRevalidate to NetworkFirst
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3, // Keep network timeout
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes for NetworkFirst GETs
      }),
    ],
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
      // Add a custom plugin to provide an image fallback for failed image requests
      {
        handlerDidError: async ({ request }) => {
          // Check if the request was for an image
          if (request.destination === 'image') {
            console.log(`[Service Worker] Image fetch failed, serving placeholder for: ${request.url}`);
            try {
              // Fetch the placeholder image from the data URI
              const response = await fetch(IMAGE_PLACEHOLDER_DATA_URI);
              return response;
            } catch (error) {
              console.error('[Service Worker] Failed to fetch image placeholder, returning error:', error);
              return Response.error(); // Fallback if even placeholder fails
            }
          }
          // For other asset types (script, style) or if not an image, let Workbox handle the error
          return Response.error();
        },
      },
      // Add cache monitoring plugin
      cacheMonitorPlugin,
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
      // For failed navigation requests, return the precached offline page.
      return caches.match('/offline.html');
    default:
      // For other failed requests, return a standard error response.
      return Response.error();
  }
});