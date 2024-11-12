const babel = require('@rollup/plugin-babel').default;
const { terser } = require('rollup-plugin-terser');
const pkg = require('./package.json');
const postcss = require('rollup-plugin-postcss');

module.exports = () => {
  return {
    input: 'src/MagicPill.js',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
        presets: [
          '@babel/preset-env',
          '@babel/preset-react'
        ]
      }),
      postcss({
        extract: 'index.css',
        minimize: true,
      }),
      terser(),
    ],
    external: ['react', 'react-dom', 'next'],
  };
};