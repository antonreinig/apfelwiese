import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: { __APP_STAND__: JSON.stringify(new Date().toISOString().slice(0, 16)) },
  // im Entwicklungsserver dieselben Weiterleitungen wie auf Vercel (vercel.json)
  server: {
    host: true,
    proxy: {
      // APFEL_API=live npm run dev: API des Live-Servers nutzen (nur auf dem eigenen Rechner)
      ...(process.env.APFEL_API === 'live'
        ? { '/api': { target: 'https://apfelwiese.app', changeOrigin: true, headers: { origin: 'https://apfelwiese.app' }, cookieDomainRewrite: '' } }
        : {}),
      '/wm': { target: 'https://upload.wikimedia.org', changeOrigin: true, rewrite: (p) => p.replace(/^\/wm/, '') },
      '/kacheln/luftbild': {
        target: 'https://ibasemaps-api.arcgis.com', changeOrigin: true,
        rewrite: (p) => p.replace(/^\/kacheln\/luftbild\/(\d+)\/(\d+)\/(\d+)/, `/arcgis/rest/services/World_Imagery/MapServer/tile/$1/$2/$3?token=${loadEnv('development', process.cwd(), '').ARCGIS_KEY ?? ''}`),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Apfelwiese',
        short_name: 'Apfelwiese',
        description: 'Alte Apfelsorten bestimmen und dokumentieren',
        lang: 'de',
        theme_color: '#f3eee3',
        background_color: '#f3eee3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/wm\//, /^\/kacheln\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          { urlPattern: /\/sorten\/.*\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'sorten' } },
          { urlPattern: /\/wm\//, handler: 'CacheFirst', options: { cacheName: 'bilder', expiration: { maxEntries: 400 } } },
          { urlPattern: /^https:\/\/[abc]?\.?tile\.openstreetmap\.org\//, handler: 'CacheFirst', options: { cacheName: 'karte', expiration: { maxEntries: 500 } } },
        ],
      },
    }),
  ],
})
