import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// =============================================================================
// Vite Configuration — BASELINE instance (port 5173)
// =============================================================================
// Proxies API requests to the BASELINE backend on port 5001.
// Source maps enabled (aids fingerprinting — intentional vulnerability).
// =============================================================================

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    // BASELINE: Source maps enabled (aids fingerprinting)
    sourcemap: true
  }
});
