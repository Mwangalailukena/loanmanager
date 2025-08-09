// workbox-config.js
module.exports = {
  globDirectory: 'build/',
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  swSrc: 'src/sw.js',
  swDest: 'build/sw.js',
  injectionPoint: 'self.__WB_MANIFEST',
};