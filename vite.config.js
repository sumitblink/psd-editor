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
      overlay: false
    },
    watch: {
      usePolling: false,
      interval: 1000
    }
  },
  optimizeDeps: {
    include: ['fabric', 'ag-psd']
  }
})