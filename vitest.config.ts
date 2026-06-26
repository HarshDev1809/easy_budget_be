import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 20000,
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
