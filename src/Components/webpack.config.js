// webpack.config.js
const path = require('path');
const webpack = require('webpack');

module.exports = {
  // other configurations...
  resolve: {
    fallback: {
      fs: false,
      path: require.resolve("path-browserify"),
      stream: require.resolve("stream-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      net: false,
      tls: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
