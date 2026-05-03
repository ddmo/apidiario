import { createRootRoute, Outlet } from '@tanstack/react-router'
import { SyncIndicator } from '@/components/layout/sync-indicator'

export const Route = createRootRoute({
  component: () => (
    <>
      <SyncIndicator />
      <Outlet />
    </>
  ),
})
