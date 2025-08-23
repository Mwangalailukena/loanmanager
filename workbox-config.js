// workbox-config.js
module.exports = {
  globDirectory: 'build/',
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  swDest: 'build/sw.js',
  importScripts: ['src/sw.js'],
};