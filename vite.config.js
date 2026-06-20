import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Renderer (React) build config. base './' нужен, чтобы пути работали
// при загрузке из file:// в продакшене Electron.
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
