import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'edge-runtime', // Use Cloudflare Workers-compatible environment
    watch: false, // Disable watch mode by default
  },
})
