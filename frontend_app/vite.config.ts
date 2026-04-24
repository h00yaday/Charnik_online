import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths' // Импортируем плагин путей

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths() // Включаем плагины
  ],
  server: {
    host: true, 
    port: 5173,
    strictPort: true,
    allowedHosts: ['charnik-online.tech'], // Разрешаем ваш домен .tech
    watch: {
      usePolling: true, 
    },
    hmr: {
      clientPort: 443,  
      protocol: 'wws',
    },
  },
})