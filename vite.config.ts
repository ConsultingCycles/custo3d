import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',                    // ← adiciona essa linha
  build: {
    outDir: 'dist'              // ← garante que vai para dist
  },
  server: {
    port: 5173,
    host: true
  }
})