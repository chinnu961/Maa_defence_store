import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all /api requests from the Vite dev server to the FastAPI backend,
      // so the React app can call fetch('/api/...') without hitting CORS in dev.
      '/api': {
        target: 'https://maa-defence-api.onrender.com',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://maa-defence-api.onrender.com',
        changeOrigin: true
      }
    }
  }
});
