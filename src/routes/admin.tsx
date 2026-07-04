import { createFileRoute, Outlet, redirect, Link, useRouterState } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Users, Activity, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
    const { data: isAdmin } = await supabase.rpc('is_app_admin')
    if (!isAdmin) throw redirect({ to: '/' })
  },
  component: AdminLayout,
})

const NAV_ITEMS = [
  { to: '/admin' as const, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users' as const, label: 'Utenti', icon: Users },
  { to: '/admin/attivita' as const, label: 'Attività', icon: Activity },
]

function AdminLayout() {
  const { location } = useRouterState()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-amber-900/20">
        <div className="flex items-center gap-2">
          <img src="/icons/icon-no-bg.svg" alt="" className="h-8 w-8" />
          <div>
            <p className="font-display font-semibold text-amber-50 text-base leading-tight">Apidiario</p>
            <p className="text-xs text-amber-300/70 leading-none">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-amber-600/30 text-amber-100'
                  : 'text-amber-200/70 hover:bg-amber-700/20 hover:text-amber-100'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-amber-900/20 space-y-1">
        <a
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-200/70 hover:bg-amber-700/20 hover:text-amber-100 transition-colors"
        >
          <ExternalLink size={18} strokeWidth={1.75} />
          Vai all'app
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-200/70 hover:bg-amber-700/20 hover:text-amber-100 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Esci
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex bg-stone-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-amber-950 sticky top-0 h-dvh overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile: top bar + drawer */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-amber-950 border-b border-amber-900/40 h-14 flex items-center px-4 gap-3">
        <img src="/icons/icon-no-bg.svg" alt="" className="h-7 w-7" />
        <span className="font-display font-semibold text-amber-50 flex-1">Apidiario Admin</span>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="size-9 flex items-center justify-center text-amber-200 hover:text-amber-50"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-20 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-14 bottom-0 left-0 z-30 w-64 bg-amber-950 overflow-y-auto">
            <Sidebar />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  )
}
