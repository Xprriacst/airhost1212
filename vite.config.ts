import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      include: ['airtable']
    },
    server: {
      host: true,
      port: 5173,
    },
    define: {
      'process.env': env
    }
  };
});