module.exports = (config) => {
  config.set({
    basePath: '../',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      { pattern: 'dist/index.js', type: 'module' },
      { pattern: 'test/index.js', type: 'module' },
      { pattern: 'test/*.js', type: 'module', included: false }
    ],
    browsers: [
      'ChromeHeadless'
    ],
    reporters: [
      'dots'
    ],
    port: 1234,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: false,
    singleRun: true,
    // https://github.com/karma-runner/karma/pull/2834#issuecomment-376854730
    customContextFile: 'test/context.html',
    customDebugFile: 'test/debug.html'
  });
};
