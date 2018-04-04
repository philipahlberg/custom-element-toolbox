const { resolve } = require('path');

module.exports = {
  mode: 'development',
  resolve: {
    alias: {
      'lib': resolve('./src/index.js')
    }
  },
  devtool: 'inline-source-map',
  performance: {
    hints: false
  }
}