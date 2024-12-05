import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // React plugin for Vite
  ],
  optimizeDeps: {
    exclude: ['lucide-react'], // Excluding `lucide-react` from optimization
  },
  server: {
    host: '0.0.0.0',  // Ensuring the dev server is accessible externally
    port: 3000,       // Default port for Vite
    strictPort: true, // Ensures Vite will not try another port if 3000 is taken
  },
  build: {
    target: 'esnext', // Set the target for modern JavaScript
    outDir: 'dist',   // Output directory for the build
  },
});
