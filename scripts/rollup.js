import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import dev from './rollup.dev';

export default [
  dev,
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
];
