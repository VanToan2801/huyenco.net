import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    host: true, // Listen on all addresses (0.0.0.0)
    strictPort: true,
    hmr: {
      host: '192.168.1.2',
      clientPort: 3005
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
