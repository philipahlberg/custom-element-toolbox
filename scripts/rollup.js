import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: './src/index.js',
    output: {
      file: './dist/index.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve()
    ]
  },
  {
    input: './src/index.js',
    output: {
      file: './dist/index.min.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve(),
      terser()
    ]
  }
]