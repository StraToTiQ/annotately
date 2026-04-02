import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})




