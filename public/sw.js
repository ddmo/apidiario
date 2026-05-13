// Push‑only service worker — no fetch handler, no caching
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))

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
