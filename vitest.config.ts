import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    deps: {
      // optimizer: {
      //   web: {
      //     include: ['reflect-metadata']
      //   }
      // }
    },
  },
})
