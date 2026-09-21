import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Same-origin API calls in development: cookies "just work".
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  // `npm run share` serves the built app with "vite preview": same-origin /api, reachable through a tunnel.
  preview: {
    port: 4173,
    strictPort: true,
    // The tunnel's public address is a different host name every time, so any host is allowed.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
        // The browser's Origin is the public address; the API only trusts its own web origin, and
        // this preview server IS that web app, so present it as such (SameSite=Lax cookies still
        // stop other sites from acting on a player's behalf).
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const origin = process.env.WEB_ORIGIN;
            if (origin && proxyReq.getHeader('origin')) proxyReq.setHeader('origin', origin);
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
