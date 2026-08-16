// ============================================================
// vite.config.ts — Vite is the dev server / build tool for Vue.
// The vue() plugin lets Vite understand .vue files.
// That's all we need; everything else has sensible defaults.
// ============================================================

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Bind to IPv4 loopback on a fixed port so browsers always reach the
  // dev server via http://localhost:5173 (no silent port jumps).
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
