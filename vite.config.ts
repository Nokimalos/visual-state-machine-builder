import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const nodeEnv = mode === 'production' ? 'production' : 'development'

  return {
    plugins: [react()],
    define: {
      // Babel (code parser) expects Node's process in the browser
      // Values must be valid JSON strings for esbuild's define.
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'process': JSON.stringify({ env: { NODE_ENV: nodeEnv } }),
    },
  }
})
