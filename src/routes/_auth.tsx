import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
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
    <div className="flex h-dvh" style={{ '--bottom-nav-h': '64px' } as React.CSSProperties}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 min-h-0 max-w-lg tablet:max-w-none mx-auto tablet:mx-0 w-full">
          <Outlet />
        </main>
        <SyncIndicator />
        <div className="tablet:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
