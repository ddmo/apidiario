import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SyncIndicator } from '@/components/layout/sync-indicator'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex flex-col h-dvh" style={{ '--bottom-nav-h': '64px' } as React.CSSProperties}>
      <main className="flex-1 min-h-0 max-w-lg mx-auto w-full">
        <Outlet />
      </main>
      <SyncIndicator />
      <BottomNav />
    </div>
  )
}
