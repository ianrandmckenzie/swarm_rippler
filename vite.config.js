// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    outDir: 'docs',
    emptyOutDir: false, // Don't empty the docs directory to preserve existing files like CNAME
  },
  publicDir: 'public', // Ensure public files are copied
})
