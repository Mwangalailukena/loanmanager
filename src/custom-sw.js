importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute([]);

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'logo192.png',
    badge: 'logo192.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
