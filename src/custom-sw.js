/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// --- Initialize Firebase ---
// Use process.env variables injected by Webpack/Craco during build
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is available
if (firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // --- Firebase Background Message Handler ---
  onBackgroundMessage(messaging, (payload) => {
    // console.log('[custom-sw.js] Received background message', payload); // Log removed for production

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
}

const SW_VERSION = '2.0.0-modular'; // Updated version

// --- Lifecycle Events & Message Handling ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
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
      const currentRuntimeCaches = new Set(['api-cache', 'static-assets']);
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (!cacheName.startsWith('workbox-') && !currentRuntimeCaches.has(cacheName)) {
          await caches.delete(cacheName);
        }
      }
      // clientsClaim() allows the new service worker to take control of open pages immediately.
      clientsClaim();
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

// --- Workbox Configuration ---

// This injects the file manifest for precaching.
precacheAndRoute(self.__WB_MANIFEST);

// This call cleans up old precaches.
cleanupOutdatedCaches();

const IMAGE_PLACEHOLDER_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

// --- Routing ---

// App Shell Pattern: Serve index.html for all navigation requests
registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL('/index.html'),
    {
      denylist: [
        /^\/_/, // Firebase reserved URLs
        /\/[^/?]+\.[^/]+$/ // Files with extensions
      ],
    }
  )
);

const bgSyncPlugin = new BackgroundSyncPlugin('loanManagerQueue', {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url, request }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);

registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      {
        handlerDidError: async ({ request }) => {
          if (request.destination === 'image') {
            const response = await fetch(IMAGE_PLACEHOLDER_DATA_URI);
            return response;
          }
          // Return undefined to let the browser handle the error or fallback to the catch handler
          return undefined;
        },
      },
    ],
  })
);

setCatchHandler(({ event }) => {
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
