import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    assetsInlineLimit: 0, // Ensure frames aren't inlined as base64 strings
    target: 'esnext'
  }
});
