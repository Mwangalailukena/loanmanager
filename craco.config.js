const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc: './src/custom-sw.js',
          swDest: 'service-worker.js',
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        }),
      ].filter(Boolean),
    },
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          maxInitialRequests: 20,
          maxAsyncRequests: 20,
          minSize: 20000,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              name: 'react-vendors',
              chunks: 'all',
            },
            mui: {
              test: /[\\/]node_modules[\\/](@mui)[\\/]/,
              name: 'mui-vendors',
              chunks: 'all',
            },
            firebase: {
              test: /[\\/]node_modules[\\/](@firebase|firebase)[\\/]/,
              name: 'firebase-vendors',
              chunks: 'all',
            }
          },
        };
      }
      return webpackConfig;
    },
  },
};