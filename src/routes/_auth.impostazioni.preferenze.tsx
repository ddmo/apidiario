import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { ArrowLeft, SlidersHorizontal, Lightbulb, Sun, Moon, Monitor } from 'lucide-react'
import { useState } from 'react'
import { getAuthUser } from '@/lib/auth-guard'
import { setThemeMode, getThemeMode, type ThemeMode } from '@/lib/theme'

export const Route = createFileRoute('/_auth/impostazioni/preferenze')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: PreferencePage,
})

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Chiaro' },
  { mode: 'system', icon: Monitor, label: 'Sistema' },
  { mode: 'dark', icon: Moon, label: 'Scuro' },
]

function PreferencePage() {
  const [themeMode, setThemeLocal] = useState<ThemeMode>(getThemeMode())

  function handleThemeChange(mode: ThemeMode) {
    setThemeLocal(mode)
    setThemeMode(mode)
  }

  return (
    <div className="fixed inset-0 bg-cream-50 text-wood-700 flex flex-col z-10">
      <header className="shrink-0 bg-cream-50/95 backdrop-blur-sm border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <Link
          to="/piu"
          aria-label="Indietro"
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </Link>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Preferenze
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5 flex flex-col gap-2">
        <Link
          to="/impostazioni/ispezione-express"
          className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
        >
          <SlidersHorizontal size={20} className="text-honey-600 shrink-0" />
          <span className="text-sm font-medium">Personalizza vista Express</span>
        </Link>

        <Link
          to="/impostazioni/suggerimenti"
          className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-wood-800 hover:bg-cream-200 transition-colors"
        >
          <Lightbulb size={20} className="text-honey-600 shrink-0" />
          <span className="text-sm font-medium">Suggerimenti</span>
        </Link>

        <div className="flex flex-col gap-2 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 mt-2">
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
      </div>
    </div>
  )
}
