import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Standardizing process.env availability for the browser
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    strictPort: true
  }
});