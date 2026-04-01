import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // ... другие настройки
  server: {
    host: true, // Обязательно! Чтобы Vite слушал на 0.0.0.0, а не только внутри localhost контейнера
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Нужно для корректной работы hot reload внутри Docker на Windows/Linux
    },
    hmr: {
      clientPort: 80, // Говорим браузеру стучаться за обновлениями кода на порт 80 (к Nginx)
    },
  },
})