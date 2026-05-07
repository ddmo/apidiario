import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persister } from '@/lib/query-client'
import { router } from '@/router'
import { applyThemeFromSystem } from '@/lib/theme'
import '@/app.css'

applyThemeFromSystem()

// Prevent pinch-to-zoom on iOS Safari (ignores user-scalable=no since iOS 10)
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false })
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault()
}, { passive: false })

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root non trovato in index.html')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </React.StrictMode>,
)
