import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project page on GitHub Pages is served from /ai-marketplace/ — every
// asset reference must be rewritten against that sub-path at build time.
export default defineConfig({
  base: '/ai-marketplace/',
  plugins: [react()],
})
