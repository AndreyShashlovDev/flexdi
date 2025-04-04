import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

export default [
  // Core
  {
    input: 'src/core/index.ts',
    output: [
      {
        file: 'dist/cjs/core/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/esm/core/index.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
    external: ['react', 'rxjs', 'reflect-metadata'],
  },
  // React
  {
    input: 'src/react/index.ts',
    output: [
      {
        file: 'dist/cjs/react/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/esm/react/index.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
    external: ['react', 'rxjs', 'reflect-metadata'],
  }
]
