const POLYFILLS = [
  '@webcomponents/custom-elements',
  '@webcomponents/shadydom',
  '@webcomponents/shadycss/scoping-shim.min.js'
].map(p => ({ pattern: require.resolve(p) }));

module.exports = (config) => {
  config.set({
    basePath: '../',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      ...POLYFILLS,
      { pattern: 'dist/index.js', type: 'module' },
      { pattern: 'test/utils.js', type: 'module' },
      { pattern: 'test/*.spec.js', type: 'module' }
    ],
    browsers: ['Chrome', 'Edge', 'FirefoxESM'],
    customLaunchers: {
      FirefoxESM: {
        base: 'Firefox',
        prefs: {
          'dom.moduleScripts.enabled': true
        }
      }
    },
    reporters: ['progress'],
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