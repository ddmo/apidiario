import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
// import { VitePWA } from 'vite-plugin-pwa'
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
    https: true,
    proxy: {
      '/api': 'http://localhost:8787',
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
    // PWA disabilitato temporaneamente — test se il service worker causa "undefined arnie attive"
    // VitePWA({...}),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
