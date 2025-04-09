import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    react({
      jsxRuntime: 'classic'
    }),
    dts({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      outDir: 'dist/types'
    })
  ],
  build: {
    lib: {
      entry: {
        'index': resolve(__dirname, 'src/core/index.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts'),
        'react-native/index': resolve(__dirname, 'src/react-native/index.ts'),
        'vue3/index': resolve(__dirname, 'src/vue3/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    outDir: 'dist',
    rollupOptions: {
      makeAbsoluteExternalsRelative: false,
      external: ['react', 'react/jsx-runtime', 'react-dom', 'vue', 'vue-router', 'rxjs', 'reflect-metadata'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          vue: 'Vue',
          'vue-router': 'VueRouter',
          rxjs: 'rxjs',
          'reflect-metadata': 'Reflect'
        },
        preserveModules: true,
        preserveModulesRoot: 'src',
      }
    },
    minify: false
  },
  resolve: {
    dedupe: ['react', 'react/jsx-runtime', 'vue', 'vue-router']
  },
  optimizeDeps: {
    exclude: ['react', 'react-dom', 'react/jsx-runtime']
  }
})
