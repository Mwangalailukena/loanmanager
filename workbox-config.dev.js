module.exports = {
  swSrc: 'src/custom-sw.js',
  swDest: 'public/service-worker.js',
  globDirectory: 'public',
  globPatterns: [
    'index.html',
    'manifest.json',
    'offline.html', // Added for offline fallback
    'android/*.png'
  ],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
};
