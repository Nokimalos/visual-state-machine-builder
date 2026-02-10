import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Babel (code parser) expects Node's process in the browser
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    'process': `({ env: { NODE_ENV: ${JSON.stringify(mode === 'production' ? 'production' : 'development')} } })`,
  },
}))
