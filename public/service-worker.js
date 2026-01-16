/* eslint-disable no-restricted-globals */
/* global firebase */

/**
 * Senior Architect Audit Fix:
 * 1. Removed non-functional Workbox Background Sync for Firestore (Firestore uses WebSockets/GRPC).
 * 2. Optimized asset caching using StaleWhileRevalidate for instant loading and background updates.
 * 3. Updated Firebase SDK versions to 10.x for better compatibility.
 * 4. Implemented proper App Shell navigation routing.
 */

// 1. Import Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// 2. Import Firebase (Compat libraries for Service Worker environment)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const SW_VERSION = '2.0.0-architect-fix';

if (workbox) {
  console.log(`[ServiceWorker] Workbox loaded (v${SW_VERSION})`);

  // --- PRECACHING ---
  // Clean up old precaches and route current manifest
  workbox.precaching.cleanupOutdatedCaches();
  workbox.precaching.precacheAndRoute([{"revision":"a43df33df70f1d6f65da12dc4e358b11","url":"index.html"},{"revision":"f4f56f0f306d540469faff8256a9713d","url":"manifest.json"},{"revision":"e5fc6ebd25e2b037b038c4e3aee6e82c","url":"offline.html"},{"revision":"9b03133961813737d54b542c430787df","url":"android/android-launchericon-96-96.png"},{"revision":"bc99234a4dd9c1e072e1f0153483bd72","url":"android/android-launchericon-72-72.png"},{"revision":"07ba8c5f5b00089222373d9c44425394","url":"android/android-launchericon-512-512.png"},{"revision":"685832cba81b7eb4e2c383eb4673a85e","url":"android/android-launchericon-48-48.png"},{"revision":"8ea05e15a927b893ca6fc8cdfd593373","url":"android/android-launchericon-192-192.png"},{"revision":"5a76c4bc8e553ceb63ba73b7280eb03b","url":"android/android-launchericon-144-144.png"}] || []);

  // --- ROUTING ---

  // A. App Shell Pattern
  // Serve index.html for all navigation requests (SPA support)
  workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(
      workbox.precaching.createHandlerBoundToURL('/index.html'),
      {
        denylist: [
          /^\/_/, // Firebase reserved
          /\/[^/?]+\.[^/]+$/ // Files with extensions
        ]
      }
    )
  );

  // B. Static Resources (CSS, JS, Fonts)
  // Stale-While-Revalidate: Instant load from cache + background network update
  workbox.routing.registerRoute(
    ({ request }) => 
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // C. Images
  // Cache-First with fallback to a placeholder if desired
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // --- FIREBASE MESSAGING ---
  const firebaseConfig = {
    apiKey: "AIzaSyBJmjOEymW5xxgbhZEpWatOjSZx8byaFSY",
    authDomain: "ilukenas-loan-management.firebaseapp.com",
    projectId: "ilukenas-loan-management",
    storageBucket: "ilukenas-loan-management.appspot.com",
    messagingSenderId: "714108438492",
    appId: "1:714108438492:web:6036fbfc93272f2aaeb119",
  };

  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[ServiceWorker] Background Message:', payload);
      const { title, body, icon } = payload.notification || {};
      
      const notificationOptions = {
        body: body || '',
        icon: icon || '/logo192.png',
        badge: '/logo192.png',
        data: {
          url: payload.data?.url || '/'
        },
      };

      self.registration.showNotification(title || 'New Notification', notificationOptions);
    });
  } catch (err) {
    console.error('[ServiceWorker] Firebase init failed:', err);
  }

  // --- EVENT LISTENERS ---

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

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

  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      Promise.all([
        clients.claim(),
        // Delete old non-workbox caches if any
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.filter(name => !name.startsWith('workbox-'))
              .map(name => caches.delete(name))
          );
        })
      ])
    );
  });

} else {
  console.error('[ServiceWorker] Workbox failed to load');
}
