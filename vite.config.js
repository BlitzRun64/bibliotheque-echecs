import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Les en-têtes de sécurité déclarés dans vercel.json (CSP, etc.) sont rejoués par
// `npm run preview` afin de tester la configuration en local avant déploiement.
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'))
const enTetesSecurite = Object.fromEntries(
  (vercel.headers ?? [])
    .filter((regle) => regle.source === '/(.*)')
    .flatMap((regle) => regle.headers.map(({ key, value }) => [key, value])),
)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Mode « prompt » : le nouveau service worker attend que l'utilisateur clique sur
      // « Mettre à jour » (bandeau UpdatePrompt), puis skipWaiting + rechargement.
      registerType: 'prompt',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,webmanifest}'],
      },
      manifest: {
        name: 'Bibliothèque du club',
        short_name: 'BiblioChess',
        description: "Bibliothèque du club d'échecs",
        lang: 'fr',
        theme_color: '#073b14',
        background_color: '#073b14',
        display: 'standalone',
        start_url: '/',
        scope: '/',
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
  preview: {
    headers: enTetesSecurite,
  },
})
