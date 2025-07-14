// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    outDir: 'docs',
    emptyOutDir: false, // Don't empty the docs directory to preserve existing files like CNAME
  },
  publicDir: 'public', // Ensure public files are copied
  server: {
    port: 8080,
    strictPort: true, // Fail if port 8080 is not available
    allowedHosts: ['24e442f4997c.ngrok.app', 'localhost', '127.0.0.1']
  }
})
