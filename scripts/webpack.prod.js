const { resolve } = require('path');

module.exports = {
  mode: 'production',
  resolve: {
    alias: {
      'lib': resolve('./dist/index.js')
    }
  },
  devtool: 'inline-source-map',
  performance: {
    hints: false
  }
}