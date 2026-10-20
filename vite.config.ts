import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves project sites from /<repo-name>/. In Actions we read the
// repo name from GITHUB_REPOSITORY; locally it falls back to /feelings-log/.
// BASE_PATH overrides both (e.g. BASE_PATH=/ for a custom domain).
function pagesBase(): string {
  if (process.env.BASE_PATH) return process.env.BASE_PATH
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (!repo) return '/feelings-log/'
  if (repo.endsWith('.github.io')) return '/'
  return `/${repo}/`
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? pagesBase() : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Feelings Log',
        short_name: 'Feelings',
        description: 'Quickly log your emotions a few times a day.',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        theme_color: '#f7f6f3',
        background_color: '#f7f6f3',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
}))
