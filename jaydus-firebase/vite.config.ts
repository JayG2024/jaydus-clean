import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/', // Use absolute paths from the domain root
    plugins: [react()],
    publicDir: 'public',
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        // Proxy streaming endpoints to Netlify edge functions
        '/api/openai-stream': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8888',
          changeOrigin: true,
          secure: false,
        },
        '/api/anthropic-stream': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8888',
          changeOrigin: true,
          secure: false,
        },
        // Proxy other /api requests to Netlify functions
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8888',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix for regular functions
        },
      },
      port: parseInt(env.VITE_PORT) || 5174, // Use existing port or default
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react', 'sonner'],
            clerk: ['@clerk/clerk-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Increase the warning limit to 1000kb
    },
  };
});