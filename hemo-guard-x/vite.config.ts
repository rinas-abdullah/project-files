import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps the build portable (works from any folder or static host)
export default defineConfig({
  plugins: [react()],
  base: './',
  // Inline empty PostCSS config so Vite ignores the parent Next.js postcss.config.mjs
  css: { postcss: {} },
})
