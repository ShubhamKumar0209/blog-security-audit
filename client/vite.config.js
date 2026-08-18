import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// =============================================================================
// Vite Configuration
// =============================================================================
// SECURITY BASELINE:
//   Source maps are enabled by default in development mode.
//   This makes it easy to fingerprint the React version and examine
//   the application source code through browser DevTools.
//   In a production build, source maps should be disabled.
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
