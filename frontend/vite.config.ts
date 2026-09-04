import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // The backend serves everything under /api (e.g. /api/products), so the
      // prefix must be forwarded as-is. The previous config rewrote /api away,
      // which would 404 against the backend. This proxy is only used when
      // VITE_API_URL is set to a relative path such as "/api"; the default
      // absolute URL bypasses it entirely.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
