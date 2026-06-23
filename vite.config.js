import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/odoo': {
        target: 'https://retailasyou.odoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/odoo/, ''),
      }
    }
  }
})
