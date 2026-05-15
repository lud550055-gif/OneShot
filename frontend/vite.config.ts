import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Escape all non-ASCII chars in JS bundle to \uXXXX so encoding is irrelevant
const unicodeEscapePlugin: Plugin = {
  name: 'unicode-escape',
  generateBundle(_, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type === 'chunk') {
        chunk.code = chunk.code.replace(
          /[^\x00-\x7F]/g,
          c => `\\u${c.codePointAt(0)!.toString(16).padStart(4, '0')}`
        )
      }
    }
  },
}

export default defineConfig({
  plugins: [react(), unicodeEscapePlugin],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
