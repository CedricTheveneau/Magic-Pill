const babel = require('@rollup/plugin-babel').default;
const { terser } = require('rollup-plugin-terser');
const pkg = require('./package.json');
const postcss = require('rollup-plugin-postcss');
const typescript = require('@rollup/plugin-typescript');

module.exports = () => {
  return {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'auto'
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
        exports: 'auto'
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
        presets: [
          '@babel/preset-env',
          '@babel/preset-react',
          '@babel/preset-typescript'
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
      postcss({
        extract: 'magicpill.css',
        minimize: true,
      }),
      terser(),
    ],
    external: ['react', 'react-dom', 'next'],
  };
};