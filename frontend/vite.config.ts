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
    host: '0.0.0.0', 
    port: 5173,       
    strictPort: true, 
  },
  build: {
    target: 'esnext', 
    outDir: 'dist',  
  },
});
