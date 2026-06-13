import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { supabase } from '@/lib/supabase'
import { queryClient, persister, clearPersistedCache, getCachedUserId, setCachedUserId } from '@/lib/query-client'
import { initSyncManager } from '@/lib/sync-manager'
import { router } from '@/router'
import { applyTheme } from '@/lib/theme'
import '@/app.css'

applyTheme()

// iOS PWA home‑screen cache busting
// 1) pageshow — ricarica se pagina arriva da bfcache (iOS Safari PWA)
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload()
})
// 2) controllerchange — ricarica quando service worker prende controllo
let swRefreshing = false
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swRefreshing) return
    swRefreshing = true
    window.location.reload()
  })
}

// Prevent pinch-to-zoom on iOS Safari (ignores user-scalable=no since iOS 10)
// NB: gesturestart/gesturechange NON bloccati su input/textarea — necessario per dettatura iOS
document.addEventListener('gesturestart', (e) => {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea') {
    return
  }
  e.preventDefault()
}, { passive: false })
document.addEventListener('gesturechange', (e) => {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea') {
    return
  }
  e.preventDefault()
}, { passive: false })
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    const target = e.target as HTMLElement | null
    if (target?.closest('[data-allow-pinch]')) return
    e.preventDefault()
  }
}, { passive: false })

// Registra service worker (workbox precaching + push notifications)
// updateViaCache: 'none' → il browser non usa MAI la cache HTTP per lo script SW.
// Senza questo, sw.js cachato (immutable) impedirebbe a iOS di rilevare nuove versioni.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => {
    // iOS PWA da home: controlla aggiornamenti ogni volta che l'app torna in foreground.
    // Se trova un nuovo SW, skipWaiting+clientsClaim → controllerchange → reload automatico.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void reg.update()
    })
    // Check anche all'avvio (oltre a quello implicito della register)
    void reg.update()
  }).catch(() => { /* registrazione SW fallita: app funziona comunque online */ })
}

// Avvia sync manager: drena la queue quando si torna online
initSyncManager()

// Suppress harmless Supabase webauthn interceptor error (gotrue-js bug)
window.addEventListener('error', (e) => {
  if (
    e.message?.includes?.('signalUnknownCredential') ||
    (e.filename && e.filename.includes('webauthnInterceptor'))
  ) {
    e.preventDefault()
  }
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root non trovato in index.html')

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const cachedUserId = await getCachedUserId()

      if (cachedUserId && session && cachedUserId !== session.user.id) {
        // Utente cambiato: svuota cache persistita prima che React Query la carichi
        queryClient.clear()
        await clearPersistedCache()
      }

      if (session) {
        await setCachedUserId(session.user.id)
      }

      setReady(true)
    })
  }, [])

  if (!ready) return null

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  )
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
