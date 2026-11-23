import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/alex': 'http://localhost:4000',
      '/api/upload-webfleet': 'http://localhost:4000',
      '/api/chauffeur-configs': 'http://localhost:4000',
      '/api': 'http://localhost:8000',
    },
  },
});
