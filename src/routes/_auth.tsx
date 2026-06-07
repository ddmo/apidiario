import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { BottomNav } from '@/components/layout/bottom-nav'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: AuthLayout,
})

function AuthLayout() {
  const routeId = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="flex flex-col h-dvh">
      <main key={routeId} className="flex-1 min-h-0 max-w-lg mx-auto w-full animate-fade-in">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
