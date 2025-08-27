import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve('E:/rag-assistant-deployment', 'client'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('E:/rag-assistant-deployment', './client/src'),
      '@assets': path.resolve('E:/rag-assistant-deployment', './attached_assets'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
