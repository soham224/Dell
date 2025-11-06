const path = require('path');

module.exports = function override(config, env) {
  // Add fallback for webpack/hot/log.js
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "webpack/hot/log": path.resolve(__dirname, 'node_modules/webpack/hot/log.js')
  };

  return config;
}; 