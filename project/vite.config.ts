import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'import.meta.env.VITE_CONTRACT_ADDRESS': JSON.stringify('0x17d4FDC2d0892D98c8cDe2Ed5Bde3a47f4eB3545'),
    'import.meta.env.VITE_NETWORK_ID': JSON.stringify('5777')
  }
});
