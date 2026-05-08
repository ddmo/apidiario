import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { BottomNav } from '@/components/layout/bottom-nav'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex flex-col h-dvh">
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
