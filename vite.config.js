import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  server: {
    open: true
  },
  
 server: {
    host: true,
    allowedHosts: true
  }
})
=======
  preview: {
    host: true,
    allowedHosts: true
  },
  server: {
    host: true,
    allowedHosts: true
  }
})
>>>>>>> origin/main
