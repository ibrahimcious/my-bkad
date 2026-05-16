import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Standalone Vitest config — deliberately does not load the TanStack
// Start plugin so unit tests run against plain modules.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
