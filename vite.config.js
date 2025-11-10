import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  build: {
    // 🚀 Hide large chunk warnings (safe limit)
    chunkSizeWarningLimit: 1500,

    // ⚙️ Split large dependencies into smaller bundles
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          tiptap: [
            '@tiptap/core',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-text-align',
            '@tiptap/extension-image',
          ],
          charts: ['chart.js', 'react-chartjs-2'],
          pdf: ['@react-pdf/renderer', 'react-pdf', 'react-pdf-tailwind'],
          vendor: ['axios', 'framer-motion', 'sweetalert2'],
        },
      },
    },
  },
})
