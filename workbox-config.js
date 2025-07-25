module.exports = {
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,svg,json}',
  ],
  swDest: 'build/service-worker.js',
  clientsClaim: true,
  skipWaiting: true,
};

