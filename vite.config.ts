import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

function getVersion() {
  const pkg = require('./package.json')
  try {
    const hash = require('child_process').execSync('git rev-parse --short HEAD').toString().trim()
    return `${pkg.version}+${hash}`
  } catch {
    return pkg.version
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getVersion()),
  },
  server: {
    proxy: {
      '/api/': 'http://localhost:8787',
    },
  },
  plugins: [
    basicSsl(),
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: null,  // Registrazione manuale in main.tsx
      manifest: {
        name: 'Apidiario',
        short_name: 'Apidiario',
        description: 'Gestione apiari e arnie',
        theme_color: '#D97706',
        background_color: '#fafaf5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: false,  // SW solo in prod — evita problemi di caching in dev
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
