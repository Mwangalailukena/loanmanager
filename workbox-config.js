const {InjectManifest} = require('workbox-webpack-plugin');

module.exports = {
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json}'
  ],
  swDest: 'public/service-worker.js',
  runtimeCaching: [{
    urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images',
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      },
    },
  }, {
    urlPattern: /\.(?:js|css)$/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-resources',
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'google-fonts-stylesheets',
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-webfonts',
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
      },
    },
  }],
  offlineGoogleAnalytics: true,
  navigateFallback: '/offline.html',
  cleanupOutdatedCaches: true,
  skipWaiting: true,
  clientsClaim: true,
};
