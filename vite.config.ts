import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Installable, and the app itself (screens, the 38 surahs' letters, fonts) works offline. The recitations stream
    // from quranicaudio.com and still need the internet: caching them for phones that ask for parts of a file
    // (Safari) needs the files hosted with the right headers first.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png', 'fonts/UthmanicHafs.woff2'],
      manifest: {
        name: 'Jana Tajweed',
        short_name: 'Jana Tajweed',
        description: 'Learn tajweed and recite the Quran, letter by letter. For children aged 4 to 12.',
        lang: 'en',
        dir: 'auto',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fff7e6',
        theme_color: '#1fae62',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,woff,png,svg}'],
        navigateFallback: '/index.html'
      }
    })
  ],
  test: { include: ['test/**/*.test.ts'] }
} as never);
