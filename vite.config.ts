import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    // Allow the dev server to be reached through a Cloudflare quick
    // tunnel (temporary, for remote testing only — see docs/deploy.md
    // for the real deployment path).
    allowedHosts: ['.trycloudflare.com'],
  },
  plugins: [tailwindcss(), tanstackStart()],
})
