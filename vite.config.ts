import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cloudflare from '@cloudflare/vite-plugin'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Explicitly configure the Cloudflare plugin to ensure Miniflare (Worker emulation) runs correctly.
    // The compatibility_date should match the one in wrangler.jsonc.
    cloudflare({
      compatibilityDate: '2025-04-24',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  // This helps Vite's dependency scanner and can prevent issues.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'hono'],
  },
  server: {
    // This proxy is essential for local development to route /api calls to the wrangler dev server.
    // Wrangler's default port is 8787.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext', // Ensure modern JS for Cloudflare Workers environment
  }
})