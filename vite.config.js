import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    hmr: {
      port: 5000,
      overlay: false,
      clientPort: 5000
    },
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  optimizeDeps: {
    include: ['fabric', 'ag-psd', '@chakra-ui/react', 'react-redux']
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        warn(warning);
      }
    }
  }
})