const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        process.env.NODE_ENV === 'production' &&
          new WorkboxWebpackPlugin.InjectManifest({
            swSrc: './src/custom-sw.js',
            swDest: 'service-worker.js',
          }),
      ].filter(Boolean),
    },
  },
};
