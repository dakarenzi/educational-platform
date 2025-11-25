import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cloudflare from '@cloudflare/vite-plugin'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // The cloudflare plugin is configured via wrangler.jsonc, explicit options here are often not needed.
    // Ensuring it's just included is the safest bet to avoid misconfiguration.
    cloudflare()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  // This helps Vite's dependency scanner and can prevent issues like 'browserHash' undefined.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'hono'],
  },
  server: {
    // This proxy is essential for local development to route /api calls to the wrangler dev server.
    proxy: {
      '/api': 'http://127.0.0.1:8788',
    },
  },
  build: {
    target: 'esnext', // Ensure modern JS for Cloudflare Workers environment
  }
})