importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// This is the service worker script that will be injected with the manifest
// by the `injectManifest` build process.
workbox.precaching.precacheAndRoute([{"revision":"d39853392df80baef1a647a9b7a1d823","url":"index.html"},{"revision":"5e1a301e9b82c1cb08aea4148bd56100","url":"manifest.json"}]);

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
  clickedNotification.close(); // Close the notification

  // Retrieve the data from the notification payload
  const notificationData = clickedNotification.data;

  // Define a default URL or extract a URL from the payload if available
  const urlToOpen = notificationData?.url || '/'; // Use notificationData instead of payload

  // Open a window and focus it, navigating to the specified URL
  event.waitUntil(
    self.clients.openWindow(urlToOpen).then(windowClient => {
      if (windowClient) {
        return windowClient.focus();
      }
      // If no window was opened (e.g., app was closed), you might want to handle this
      // by opening a new window or redirecting.
    })
  );
});