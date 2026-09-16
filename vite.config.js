import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mirchiAuthPlugin } from './server/authPlugin.js';

export default defineConfig({
  plugins: [react(), mirchiAuthPlugin()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
});
