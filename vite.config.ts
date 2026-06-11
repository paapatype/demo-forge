import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: the client (5173) calls /api which Vite proxies to the Express proxy (3001).
// This keeps dev same-origin (no cors dep) and maps cleanly to a Vercel function later.
export default defineConfig({
  // Relative base so the static build works under any path — including the GitHub Pages
  // project subpath (paapatype.github.io/demo-forge/).
  base: './',
  plugins: [react()],
  server: {
    // 5174 (not Vite's default 5173) so Demo Forge coexists with the sibling indexarch-dashboard.
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
