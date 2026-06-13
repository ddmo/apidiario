import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope & typeof globalThis

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

// Precache tutti gli asset buildati (manifest iniettato da VitePWA a build time)
precacheAndRoute(self.__WB_MANIFEST)

// SPA navigation: serve sempre il precachato index.html per qualsiasi route
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

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

// Google Fonts CSS (googleapis.com) — stylesheet con URL font
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 365 * 86_400 })],
  })
)

// Google Fonts binary files (gstatic.com) — immutabili, CacheFirst
registerRoute(
  ({ url }) => url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 86_400 })],
  })
)

// Supabase Storage — foto arnie/apiari: StaleWhileRevalidate.
// Le signed URL scadono ma le immagini non cambiano; offline serve dalla cache.
// REST API (/rest/v1/) esclusa: dati gestiti da TanStack Query + IndexedDB.
registerRoute(
  ({ url }) =>
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.startsWith('/storage/v1/object/'),
  new StaleWhileRevalidate({
    cacheName: 'supabase-photos',
    plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 7 * 86_400 })],
  })
)

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
