import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Separate build for the public catalogue viewer (viewer.html). Unlike the main app, this one
 * collapses to a SINGLE JS chunk + single CSS via inlineDynamicImports — including model-viewer —
 * so the in-browser "Build" can inline it into one self-contained file with nothing left to 404.
 * Writes into the same dist/ as the main build (emptyOutDir: false) so the deployed site serves both
 * index.html (the tool) and viewer.html (what standalone files are forged from).
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: 'viewer.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'assets/viewer-[hash].js',
        assetFileNames: 'assets/viewer-[hash][extname]',
      },
    },
  },
})
