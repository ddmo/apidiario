import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope & typeof globalThis

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

// Precache tutti gli asset buildati (manifest iniettato da VitePWA a build time)
precacheAndRoute(self.__WB_MANIFEST)

// HTML / navigazione: network-first con fallback a cache → SPA funziona offline
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'html-cache',
      networkTimeoutSeconds: 3,
      plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 86_400 })],
    })
  )
)

// JS/CSS non precachati (edge case):
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 86_400 })],
  })
)

// Immagini app (icone, foto arnie/apiari):
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 30 * 86_400 })],
  })
)

// Font:
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 86_400 })],
  })
)

// Supabase API (REST + storage) e /api/ (Cloudflare Worker): NO caching.
// I dati Supabase sono gestiti da TanStack Query + IndexedDB (query-client.ts).
// Workbox non intercetta fetch cross-origin non registrati — pass-through automatico.

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  const title = data.title ?? 'Apidiario'
  const options = {
    body: data.body ?? '',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    data: { url: data.url ?? '/' },
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(clients.openWindow(url))
})
