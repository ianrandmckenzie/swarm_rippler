// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    outDir: 'docs',
    emptyOutDir: false, // Don't empty the docs directory to preserve existing files like CNAME
    minify: 'terser',
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  publicDir: 'public', // Ensure public files are copied
  server: {
    port: 8080,
    strictPort: true, // Fail if port 8080 is not available
    host: 'localhost' // Only bind to localhost for security
  }
})
