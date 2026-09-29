import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// =============================================================================
// Vite Configuration — HARDENED instance (port 5174)
// =============================================================================
// Proxies API requests to the HARDENED backend on port 5002.
// Source maps disabled (prevents fingerprinting).
// =============================================================================

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true
      }
    }
  },
  build: {
    // HARDENED: Source maps disabled (prevents fingerprinting)
    sourcemap: false
  }
});
