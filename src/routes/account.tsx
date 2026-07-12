import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Lock, SlidersHorizontal, Lightbulb, Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-guard'
import { Sidebar } from '@/components/layout/sidebar'
import { ExpressSettingsContent } from '@/features/settings/components/express-settings-content'
import { SuggestionSettingsContent } from '@/features/settings/components/suggestion-settings-content'
import { setThemeMode, getThemeMode, setPalette, getPalette, type ThemeMode, type PaletteId } from '@/lib/theme'
import { cn } from '@/lib/utils'

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Chiaro' },
  { mode: 'system', icon: Monitor, label: 'Sistema' },
  { mode: 'dark', icon: Moon, label: 'Scuro' },
]

const PALETTE_OPTIONS: { id: PaletteId; label: string; swatch: string }[] = [
  { id: 'classico', label: 'Classico', swatch: '#C7891A' },
  { id: 'miele-notturno', label: 'Miele Notturno', swatch: '#E08A2C' },
  { id: 'prato-fiorito', label: 'Prato Fiorito', swatch: '#6E8863' },
  { id: 'terracotta-mediterranea', label: 'Terracotta Mediterranea', swatch: '#C1613F' },
  { id: 'ambra-contemporanea', label: 'Ambra Contemporanea', swatch: '#A13F23' },
]

export const Route = createFileRoute('/account')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: AccountPage,
})

type PanelView = 'password' | 'vista-express' | 'suggerimenti' | null

function AccountPage() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [panelView, setPanelView] = useState<PanelView>(null)
  const [themeMode, setThemeLocal] = useState<ThemeMode>(getThemeMode())
  const [palette, setPaletteLocal] = useState<PaletteId>(getPalette())

  function handleThemeChange(mode: ThemeMode) {
    setThemeLocal(mode)
    setThemeMode(mode)
  }

  function handlePaletteChange(id: PaletteId) {
    setPaletteLocal(id)
    setPalette(id)
  }

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  function openPassword() {
    setPasswordSuccess(false)
    setPasswordError('')
    setNewPassword('')
    setConfirmPassword('')
    setPanelView('password')
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
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    void navigate({ to: '/login' })
  }

  const navItemClass = 'flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors text-left w-full'
  const navItemActiveClass = 'border-honey-500 bg-honey-tint text-honey-700 hover:bg-honey-tint'

  return (
    <div className="flex h-dvh">
      <Sidebar />

      {/* Colonna voci menu */}
      <div className="w-[360px] shrink-0 border-r border-cream-200 h-full flex flex-col bg-cream-50">
        <header className="shrink-0 border-b border-cream-200 pl-4 pr-2 h-14 flex items-center gap-1">
          <h1 className="font-display text-lg font-medium text-wood-800 tracking-tight flex-1">Account</h1>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={openPassword}
              className={cn(navItemClass, panelView === 'password' && navItemActiveClass)}
            >
              <Lock size={20} className="text-wood-500 shrink-0" />
              <span className="text-sm font-medium">Cambia password</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelView('vista-express')}
              className={cn(navItemClass, panelView === 'vista-express' && navItemActiveClass)}
            >
              <SlidersHorizontal size={20} className="text-wood-500 shrink-0" />
              <span className="text-sm font-medium">Personalizza vista Express</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelView('suggerimenti')}
              className={cn(navItemClass, panelView === 'suggerimenti' && navItemActiveClass)}
            >
              <Lightbulb size={20} className="text-wood-500 shrink-0" />
              <span className="text-sm font-medium">Suggerimenti</span>
            </button>

            <div className="flex flex-col gap-2 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3">
              <span className="text-sm font-medium text-wood-700">Tema</span>
              <div className="flex gap-1.5">
                {THEME_OPTIONS.map(({ mode, icon: Icon, label }) => {
                  const active = themeMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleThemeChange(mode)}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-md text-sm font-medium transition-colors ${
                        active ? 'bg-honey-500 text-cream-50' : 'text-wood-500 hover:bg-cream-200'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3">
              <span className="text-sm font-medium text-wood-700">Palette colori</span>
              <div className="grid grid-cols-1 gap-1.5">
                {PALETTE_OPTIONS.map(({ id, label, swatch }) => {
                  const active = palette === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handlePaletteChange(id)}
                      className={`flex items-center gap-2.5 h-10 px-2.5 rounded-md text-sm font-medium transition-colors text-left ${
                        active ? 'bg-honey-tint text-honey-700' : 'text-wood-500 hover:bg-cream-200'
                      }`}
                    >
                      <span
                        className="size-4 rounded-full shrink-0 border border-cream-200"
                        style={{ backgroundColor: swatch }}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button type="button" onClick={handleLogout} disabled={loggingOut} className={navItemClass}>
              <LogOut size={20} className="text-wood-500 shrink-0" />
              <span className="text-sm font-medium">Esci</span>
            </button>
          </div>
        </div>
      </div>

      {/* Colonna contenuto */}
      <div className="flex-1 min-w-0 flex flex-col bg-cream-50">
        {panelView === 'vista-express' ? (
          <div className="flex flex-col h-full">
            <header className="shrink-0 border-b border-cream-200 px-5 h-14 flex items-center">
              <h2 className="font-display text-xl font-medium text-wood-800 tracking-tight">Personalizza vista Express</h2>
            </header>
            <ExpressSettingsContent hideHeader />
          </div>
        ) : panelView === 'suggerimenti' ? (
          <div className="flex flex-col h-full">
            <header className="shrink-0 border-b border-cream-200 px-5 h-14 flex items-center">
              <h2 className="font-display text-xl font-medium text-wood-800 tracking-tight">Suggerimenti</h2>
            </header>
            <SuggestionSettingsContent hideHeader />
          </div>
        ) : panelView === 'password' ? (
          <div className="flex flex-col h-full">
            <header className="shrink-0 border-b border-cream-200 px-5 h-14 flex items-center">
              <h2 className="font-display text-xl font-medium text-wood-800 tracking-tight">Cambia password</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-sm flex flex-col gap-3">
                {passwordSuccess ? (
                  <p className="text-sm text-success-500">Password cambiata con successo!</p>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center px-8">
            <p className="text-sm text-wood-500 text-center">Seleziona una voce dal menu</p>
          </div>
        )}
      </div>
    </div>
  )
}
