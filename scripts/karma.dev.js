const webpack = require('./webpack.dev.js');

module.exports = (config) => {
  config.set({
    frameworks: ['mocha', 'chai', 'sinon'],
    files: ['../test/index.js'],
    preprocessors: {
      '../test/index.js': ['webpack']
    },
    browsers: ['ChromeHeadless'],
    reporters: ['progress'],
    port: 1234,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: true,
    singleRun: false,
    webpack
  });
};