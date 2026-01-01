/* global firebase, workbox */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// --- Initialize Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBJmjOEymW5xxgbhZEpWatOjSZx8byaFSY",
  authDomain: "ilukenas-loan-management.firebaseapp.com",
  projectId: "ilukenas-loan-management",
  storageBucket: "ilukenas-loan-management.appspot.com",
  messagingSenderId: "714108438492",
  appId: "1:714108438492:web:6036fbfc93272f2aaeb119",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

const SW_VERSION = '1.0.2-wb-fix'; // Updated version

// --- Firebase Background Message Handler ---
messaging.onBackgroundMessage((payload) => {
  console.log('[custom-sw.js] Received background message', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {
      url: payload.data.url || '/', // Pass URL from data payload
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- Lifecycle Events & Message Handling ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('install', () => {
  // The install event is still useful for logging or other setup.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // This part handles the cleanup of old runtime caches.
      const currentRuntimeCaches = new Set(['app-shell-pages', 'api-cache', 'static-assets']);
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (!cacheName.startsWith('workbox-') && !currentRuntimeCaches.has(cacheName)) {
          await caches.delete(cacheName);
        }
      }
      // clients.claim() allows the new service worker to take control of open pages immediately.
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

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Unhandled Promise Rejection:', event.reason);
});


// --- Workbox Configuration ---

// This injects the file manifest for precaching.
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// This call cleans up old precaches. By placing it at the top level,
// it automatically runs during the 'activate' phase of the service worker lifecycle.
workbox.precaching.cleanupOutdatedCaches();

const IMAGE_PLACEHOLDER_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

// --- Routing ---

workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'app-shell-pages',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      new workbox.expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('loanManagerQueue', {
  maxRetentionTime: 24 * 60,
});

workbox.routing.registerRoute(
  ({ url, request }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);

workbox.routing.registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      new workbox.expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      {
        handlerDidError: async ({ request }) => {
          if (request.destination === 'image') {
            const response = await fetch(IMAGE_PLACEHOLDER_DATA_URI);
            return response;
          }
          return Response.error();
        },
      },
    ],
  })
);

workbox.routing.setCatchHandler(({ event }) => {
  switch (event.request.destination) {
    case 'document':
      return caches.match('/offline.html');
    case 'script':
      return new Response('', { headers: { 'Content-Type': 'application/javascript' } });
    case 'style':
      return new Response('', { headers: { 'Content-Type': 'text/css' } });
    default:
      return Response.error();
  }
});