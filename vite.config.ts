import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cloudflare from '@cloudflare/vite-plugin'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Explicitly configure the Cloudflare plugin to ensure Miniflare (Worker emulation) runs correctly.
    cloudflare({
      compatibilityDate: '2025-04-24',
      miniflare: {
        // These options help ensure a fresh state on each run during development
        disableCache: true,
        disablePersistentCache: true,
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  optimizeDeps: {
    // Exclude miniflare from dependency optimization to prevent build issues.
    exclude: ['miniflare'],
    include: ['react', 'react-dom', 'react-router-dom', 'hono'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        // Add an error handler to prevent crashes from websocket or other proxy errors.
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn('Proxy error (non-fatal):', err.message);
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end('Proxy Error: Service temporarily unavailable.');
            }
          });
        },
      },
    },
  },
  build: {
    target: 'esnext',
  }
})