import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,},
      manifest: {
        name: 'Bibliothèque du club',
        short_name: 'BiblioChess',
        description: "Bibliothèque du club d'échecs",
        theme_color: '#2563eb',
        background_color: '#073b14',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/image/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/image/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})