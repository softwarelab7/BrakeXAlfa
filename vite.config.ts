import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/BrakeXAlfa/' : '/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        sourcemap: true
      },
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Brake X - Catálogo',
        short_name: 'Brake X',
        description: 'Consulta Rápida de Pastillas de Freno',
        theme_color: '#3b82f6',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ],

  // Configuración de build optimizada para cache-busting
  build: {
    rollupOptions: {
      output: {
        // Generar archivos con hashes únicos basados en contenido
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
}))
