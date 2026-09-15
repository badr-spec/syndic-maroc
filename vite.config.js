import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Config Vite + PWA : had l'app tkhdem b7al app native f Android w iPhone
// (ymkn n"Ajouter à l'écran d'accueil" mn Safari/Chrome)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Syndic Maroc',
        short_name: 'Syndic Maroc',
        description: 'Gestion intelligente et transparente de votre résidence',
        theme_color: '#0f3d2e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
})
