import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '@/lib/push-notifications'
import { LogOut, User, Flower2, BarChart3, Bell, BellOff, Trees, Wheat, Clock, RefreshCw, Lock, X, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { t } from '@/i18n/it'
import { cn } from '@/lib/utils'
import { PrevisioniContent } from '@/features/phenology/components/previsioni-content'
import { StatisticheContent } from '@/features/reports/components/statistiche-content'

export const Route = createFileRoute('/_auth/piu')({
  component: PiuPage,
})

type TabletPanelView = 'previsioni' | 'statistiche' | null

function PiuPage() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushToggling, setPushToggling] = useState(false)
  const [panelView, setPanelView] = useState<TabletPanelView>(null)

  // Password change state — solo mobile (su tablet/desktop si trova nel menu account della sidebar)
  const [showPasswordSheet, setShowPasswordSheet] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const { dataUpdatedAt } = useQuery({
    queryKey: ['lastDataUpdate'],
    queryFn: async () => Date.now(),
    staleTime: 0,
  })

  useEffect(() => {
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

  async function handleChangePassword() {
    setPasswordError('')
    setPasswordSuccess(false)

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('La password deve essere lunga almeno 6 caratteri.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Le password non coincidono.')
      return
    }

    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordSheet(false), 1500)
    }
  }

  async function clearCacheAndReload() {
    const savedTheme = localStorage.getItem('theme-mode')
    localStorage.clear()
    if (savedTheme) localStorage.setItem('theme-mode', savedTheme)
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    } catch { /* caches API not available */ }
    window.location.reload()
  }

  const displayName = profile?.display_name || session?.user?.email || '—'
  const lastUpdateLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString('it-IT', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Nessun dato'

  const navItemClass = 'flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors text-left w-full'
  const navItemActiveClass = 'border-honey-500 bg-honey-tint text-honey-700 hover:bg-honey-tint'

  return (
    <>
      {/* ═══ MOBILE ═══ */}
      <div className="flex flex-col h-full bg-cream-50 tablet:hidden">
        <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-4 h-14 flex items-center gap-1">
          <h1 className="font-display text-lg font-medium text-wood-800 tracking-tight flex-1">
            {t.nav.altro}
          </h1>
        </header>
        <div className="flex-1 px-4 pt-6 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-lg mx-auto">

          <div className="flex flex-col gap-2">

            {/* ── ACCOUNT ── */}
            <p className="text-xs uppercase tracking-wider font-semibold text-wood-500 mt-2 mb-1">Account</p>

            <div className="flex items-center gap-2 px-1 mb-1">
              <User size={16} className="text-wood-400 shrink-0" />
              <p className="text-sm text-wood-500">{displayName}</p>
            </div>

            <button
              type="button"
              onClick={() => { setPasswordSuccess(false); setPasswordError(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordSheet(true) }}
              className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors text-left"
            >
              <Lock size={20} className="text-wood-500 shrink-0" />
              <span className="text-sm font-medium">Cambia password</span>
            </button>

            {/* ── NAVIGAZIONE ── */}
            <p className="text-xs uppercase tracking-wider font-semibold text-wood-500 mt-2 mb-1">Navigazione</p>

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
              to="/promemoria"
              className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
            >
              <Clock size={20} className="text-honey-600 shrink-0" />
              <span className="text-sm font-medium">Promemoria</span>
            </Link>

            <Link
              to="/raccolti"
              className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
            >
              <Wheat size={20} className="text-honey-600 shrink-0" />
              <span className="text-sm font-medium">Raccolti</span>
            </Link>

            <Link
              to="/statistiche"
              className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
            >
              <BarChart3 size={20} className="text-honey-600 shrink-0" />
              <span className="text-sm font-medium">Statistiche</span>
            </Link>

            {/* ── APP ── */}
            <p className="text-xs uppercase tracking-wider font-semibold text-wood-500 mt-2 mb-1">App</p>

            <Link
              to="/impostazioni/preferenze"
              className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
            >
              <SlidersHorizontal size={20} className="text-honey-600 shrink-0" />
              <span className="text-sm font-medium">Preferenze</span>
            </Link>

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

            {/* Clear cache & refresh */}
            <button
              type="button"
              onClick={clearCacheAndReload}
              className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors text-left"
            >
              <RefreshCw size={20} className="text-wood-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Svuota cache e ricarica</p>
                <p className="text-xs text-wood-400">Forza il download di tutti i dati aggiornati</p>
              </div>
            </button>

            {/* Logout */}
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

          <p className="mt-8 text-center text-xs text-wood-600 select-all">
            v{__APP_VERSION__}
          </p>

          <div className="mt-3 text-center">
            <p className="text-xs text-wood-600">Ultimo aggiornamento dati: {lastUpdateLabel}</p>
          </div>
        </div>
        </div>

        {/* ── PASSWORD CHANGE SHEET ── */}
        {showPasswordSheet && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-wood-900/30" onClick={() => setShowPasswordSheet(false)} />
            <div className="relative w-full rounded-t-xl bg-cream-50 px-4 pb-8 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-wood-800">Cambia password</h3>
                <button type="button" onClick={() => setShowPasswordSheet(false)}>
                  <X size={20} className="text-wood-400" />
                </button>
              </div>

              {passwordSuccess ? (
                <p className="text-sm text-success-500 text-center py-4">Password cambiata con successo!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-wood-700">Nuova password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimo 6 caratteri"
                      autoComplete="new-password"
                      className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-wood-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-wood-700">Conferma password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ripeti la nuova password"
                      autoComplete="new-password"
                      className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-wood-800"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-danger-500">{passwordError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="w-full rounded-lg bg-honey-500 px-4 py-2.5 text-sm font-medium text-cream-50 hover:bg-honey-600 disabled:opacity-40 transition-colors"
                  >
                    {changingPassword ? 'Salvataggio…' : 'Salva password'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ TABLET / DESKTOP: master-detail, niente Account (nel menu della sidebar) né link ridondanti con la sidebar ═══ */}
      <div className="hidden tablet:flex h-full bg-cream-50">
        <div className="w-[360px] shrink-0 border-r border-cream-200 h-full flex flex-col">
          <header className="shrink-0 border-b border-cream-200 px-4 h-14 flex items-center">
            <h1 className="font-display text-lg font-medium text-wood-800 tracking-tight">
              {t.nav.altro}
            </h1>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setPanelView('previsioni')}
                className={cn(navItemClass, panelView === 'previsioni' && navItemActiveClass)}
              >
                <Flower2 size={20} className="text-honey-600 shrink-0" />
                <span className="text-sm font-medium">Previsioni fioriture</span>
              </button>

              <button
                type="button"
                onClick={() => setPanelView('statistiche')}
                className={cn(navItemClass, panelView === 'statistiche' && navItemActiveClass)}
              >
                <BarChart3 size={20} className="text-honey-600 shrink-0" />
                <span className="text-sm font-medium">Statistiche</span>
              </button>


              <p className="text-xs uppercase tracking-wider font-semibold text-wood-500 mt-2 mb-1">App</p>

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
                onClick={clearCacheAndReload}
                className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors text-left"
              >
                <RefreshCw size={20} className="text-wood-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Svuota cache e ricarica</p>
                  <p className="text-xs text-wood-400">Forza il download di tutti i dati aggiornati</p>
                </div>
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-wood-600 select-all">
              v{__APP_VERSION__}
            </p>
            <div className="mt-3 text-center">
              <p className="text-xs text-wood-600">Ultimo aggiornamento dati: {lastUpdateLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {panelView === 'previsioni' ? (
            <PrevisioniContent hideHeader />
          ) : panelView === 'statistiche' ? (
            <StatisticheContent hideHeader />
          ) : (
            <div className="flex-1 flex items-center justify-center px-8">
              <p className="text-sm text-wood-500 text-center">Seleziona una voce dal menu</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
