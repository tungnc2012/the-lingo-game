import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://backend:8080',
        ws: true
      }
    }
  }
})
