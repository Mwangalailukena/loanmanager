// workbox-config.js
module.exports = {
  globDirectory: 'build/',
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  swDest: 'build/sw.js',
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.destination === 'document',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'html-cache',
      },
    },
    {
      urlPattern: ({ request }) =>
        ['style', 'script', 'worker'].includes(request.destination),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'assets-cache',
      },
    },
  ],
};

