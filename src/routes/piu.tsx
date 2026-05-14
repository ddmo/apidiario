import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '@/lib/push-notifications'
import { ArrowLeft, Shield, LogOut, Sun, Moon, Monitor, User, Flower2, Activity, BarChart3, Bell, BellOff, Trees, Wheat } from 'lucide-react'
import { useEffect, useState } from 'react'
import { setThemeMode, getThemeMode, type ThemeMode } from '@/lib/theme'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/piu')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
  },
  component: PiuPage,
})

function PiuPage() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [themeMode, setThemeLocal] = useState<ThemeMode>(getThemeMode())
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushToggling, setPushToggling] = useState(false)

  const { dataUpdatedAt } = useQuery({
    queryKey: ['lastDataUpdate'],
    queryFn: async () => Date.now(),
    staleTime: 0,
  })

  function handleThemeChange(mode: ThemeMode) {
    setThemeLocal(mode)
    setThemeMode(mode)
  }

  // Expose version globally for console debugging
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__APP_VERSION__ = __APP_VERSION__
    ;(supabase.rpc as any)('is_app_admin').then(({ data }: { data: boolean | null }) => setIsAdmin(!!data))
    getPushStatus().then((s) => {
      setPushSupported(s.supported)
      setPushSubscribed(s.subscribed)
    })
  }, [])

  async function togglePush() {
    setPushToggling(true)
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush()
        setPushSubscribed(false)
      } else {
        const ok = await subscribeToPush()
        setPushSubscribed(ok)
      }
    } finally {
      setPushToggling(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    navigate({ to: '/login' })
  }

  const displayName = profile?.display_name || session?.user?.email || '—'
  const lastUpdateLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString('it-IT', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Nessun dato'

  return (
    <main className="min-h-dvh px-4 py-6">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-wood-500 hover:text-wood-700"
        >
          <ArrowLeft size={16} />
          Indietro
        </Link>
      </div>
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-medium text-wood-800 mb-6">
          {t.nav.altro}
        </h1>

        <div className="flex flex-col gap-2">
          {/* User info */}
          <div className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3">
            <User size={20} className="text-wood-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-wood-800">{displayName}</p>
              {profile?.display_name && session?.user?.email && session.user.email !== profile.display_name && (
                <p className="text-xs text-wood-400">{session.user.email}</p>
              )}
            </div>
          </div>
          <Link
            to="/apiaries/new"
            className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
          >
            <Trees size={20} className="text-honey-600 shrink-0" />
            <span className="text-sm font-medium">Nuovo apiario</span>
          </Link>
          <Link
            to="/previsioni"
            className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
          >
            <Flower2 size={20} className="text-honey-600 shrink-0" />
            <span className="text-sm font-medium">Previsioni fioriture</span>
          </Link>

          <Link
            to="/statistiche"
            className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
          >
            <BarChart3 size={20} className="text-honey-600 shrink-0" />
            <span className="text-sm font-medium">Statistiche</span>
          </Link>

          <Link
            to="/raccolti"
            className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
          >
            <Wheat size={20} className="text-honey-600 shrink-0" />
            <span className="text-sm font-medium">Raccolti</span>
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/admin/users"
                className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
              >
                <Shield size={20} className="text-honey-600 shrink-0" />
                <span className="text-sm font-medium">{t.admin.users}</span>
              </Link>

              <Link
                to="/admin/attivita"
                className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
              >
                <Activity size={20} className="text-honey-600 shrink-0" />
                <span className="text-sm font-medium">Attività</span>
              </Link>
            </>
          )}

          {/* Theme selector */}
          <div className="flex flex-col gap-2 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3">
            <span className="text-sm font-medium text-wood-700">Tema</span>
            <div className="flex gap-1.5">
              {([
                { mode: 'light' as const, icon: Sun, label: 'Chiaro' },
                { mode: 'system' as const, icon: Monitor, label: 'Sistema' },
                { mode: 'dark' as const, icon: Moon, label: 'Scuro' },
              ]).map(({ mode, icon: Icon, label }) => {
                const active = themeMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleThemeChange(mode)}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-honey-500 text-cream-50'
                        : 'text-wood-500 hover:bg-cream-200'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Push notification toggle */}
          {pushSupported && (
            <button
              type="button"
              onClick={togglePush}
              disabled={pushToggling}
              className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors text-left disabled:opacity-50"
            >
              {pushSubscribed ? (
                <Bell size={20} className="text-honey-600 shrink-0" />
              ) : (
                <BellOff size={20} className="text-wood-400 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {pushSubscribed ? 'Notifiche attive' : 'Notifiche disattivate'}
                </p>
                <p className="text-xs text-wood-400">
                  {pushSubscribed
                    ? 'Ricevi notifiche quando qualcuno aggiunge un\'ispezione su un apiario condiviso'
                    : 'Attiva per ricevere notifiche su nuovi inserimenti'}
                </p>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors text-left"
          >
            <LogOut size={20} className="text-wood-500 shrink-0" />
            <span className="text-sm font-medium">Esci</span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-wood-400 select-all">
          v{__APP_VERSION__}
        </p>

        {/* Last data update — lighter style at bottom */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-wood-300">Ultimo aggiornamento dati: {lastUpdateLabel}</p>
        </div>
      </div>
    </main>
  )
}
