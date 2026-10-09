import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Открывает доступ из локальной сети
    port: 5173,
    allowedHosts: [
      'localhost',
      '.loca.lt', // Все localtunnel домены
      '.ngrok.io',
      '.ngrok-free.app',
      '.ngrok-free.dev',
    ],
    hmr: {
      clientPort: 5173, // Локальный порт для HMR
    }
  }
})
