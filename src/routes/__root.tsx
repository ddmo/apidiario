import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { queryClient, clearPersistedCache } from '@/lib/query-client'
import { SyncIndicator } from '@/components/layout/sync-indicator'
import { ToastProvider } from '@/components/ui/toast'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate({ to: '/set-password' })
      }
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        void clearPersistedCache()
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <ToastProvider>
      <SyncIndicator />
      <Outlet />
    </ToastProvider>
  )
}
