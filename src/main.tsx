import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { supabase } from '@/lib/supabase'
import { queryClient, persister, clearPersistedCache, getCachedUserId, setCachedUserId } from '@/lib/query-client'
import { router } from '@/router'
import { applyTheme } from '@/lib/theme'
import '@/app.css'

applyTheme()

// Prevent pinch-to-zoom on iOS Safari (ignores user-scalable=no since iOS 10)
// NB: gesturestart/gesturechange NON bloccati su input/textarea — necessario per dettatura iOS
document.addEventListener('gesturestart', (e) => {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea') {
    console.log('[gesturestart] su input — permesso per dettatura')
    return
  }
  e.preventDefault()
}, { passive: false })
document.addEventListener('gesturechange', (e) => {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea') {
    console.log('[gesturechange] su input — permesso per dettatura')
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

// Register push‑only service worker (no fetch handler — no caching issues)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

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
