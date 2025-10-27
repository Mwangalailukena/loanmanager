module.exports = {
  swSrc: 'src/custom-sw.js',
  swDest: 'build/service-worker.js',
  globDirectory: 'build',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json}'
  ],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
};
