import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // During development the API runs separately; forward /api calls to it.
    proxy: { '/api': 'http://localhost:5000' },
  },
});
