// Import Workbox and Firebase Messaging
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// --- Initialize Firebase ---
// Replace with your app's configuration
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

const SW_VERSION = '1.0.1-fcm'; // Updated version

// --- Firebase Background Message Handler ---
messaging.onBackgroundMessage((payload) => {
  console.log('[service-worker.js] Received background message', payload);

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

// --- Firebase Notification Click Handler ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window for the app is already open, focus it and navigate.
      for (const client of clientList) {
        // Check if the client URL matches the target origin
        if (new URL(client.url).origin === self.location.origin) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});


self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      workbox.precaching.cleanupOutdatedCaches();
      const currentRuntimeCaches = new Set(['app-shell-pages', 'api-cache', 'static-assets']);
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (!cacheName.startsWith('workbox-') && !currentRuntimeCaches.has(cacheName)) {
          await caches.delete(cacheName);
        }
      }
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

// Precaching routes (manifest is injected)
workbox.precaching.precacheAndRoute([{"revision":"d39853392df80baef1a647a9b7a1d823","url":"index.html"},{"revision":"5e1a301e9b82c1cb08aea4148bd56100","url":"manifest.json"},{"revision":"9b03133961813737d54b542c430787df","url":"android/android-launchericon-96-96.png"},{"revision":"bc99234a4dd9c1e072e1f0153483bd72","url":"android/android-launchericon-72-72.png"},{"revision":"07ba8c5f5b00089222373d9c44425394","url":"android/android-launchericon-512-512.png"},{"revision":"685832cba81b7eb4e2c383eb4673a85e","url":"android/android-launchericon-48-48.png"},{"revision":"8ea05e15a927b893ca6fc8cdfd593373","url":"android/android-launchericon-192-192.png"},{"revision":"5a76c4bc8e553ceb63ba73b7280eb03b","url":"android/android-launchericon-144-144.png"}]);

// Caching strategies remain the same
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

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      new workbox.expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('sync-queue', {
  maxRetentionTime: 24 * 60
});

workbox.routing.registerRoute(
  ({url, request}) =>
    url.pathname === '/api/data' && request.method === 'POST',
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  })
);

workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

workbox.routing.setCatchHandler(({ event }) => {
  switch (event.request.destination) {
    case 'document':
      return workbox.precaching.matchPrecache('/index.html');
    default:
      return Response.error();
  }
});