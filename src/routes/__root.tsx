import { createRootRoute, Outlet } from '@tanstack/react-router'
import { SyncIndicator } from '@/components/layout/sync-indicator'
import { ToastProvider } from '@/components/ui/toast'

export const Route = createRootRoute({
  component: () => (
    <ToastProvider>
      <SyncIndicator />
      <Outlet />
    </ToastProvider>
  ),
})
