import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Home, CalendarDays, Syringe, Wheat, Bell, MoreHorizontal, ClipboardCheck, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n/it'
import { useAuth } from '@/hooks/use-auth'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { HivePickerSheet } from '@/features/inspections/components/hive-picker-sheet'

type NavItem = {
  to: '/' | '/calendario' | '/trattamenti' | '/raccolti' | '/promemoria' | '/piu'
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
  { to: '/calendario', label: t.nav.calendario, icon: CalendarDays, match: (p) => p === '/calendario' },
  { to: '/trattamenti', label: 'Trattamenti', icon: Syringe, match: (p) => p.startsWith('/trattamenti') },
  { to: '/raccolti', label: 'Raccolti', icon: Wheat, match: (p) => p.startsWith('/raccolti') },
  { to: '/promemoria', label: 'Promemoria', icon: Bell, match: (p) => p.startsWith('/promemoria') },
  {
    to: '/piu',
    label: t.nav.altro,
    icon: MoreHorizontal,
    match: (p) => p === '/piu' || p === '/statistiche' || p === '/previsioni' || p.startsWith('/impostazioni'),
  },
]

/**
 * Sidebar persistente per tablet/desktop (≥834px). Sostituisce la BottomNav
 * mobile, che resta invariata sotto quella soglia. Si condensa a sole icone
 * (72px) tra 834 e 1023px, icona+testo (232px) da 1024px in su.
 */
export function Sidebar() {
  const { location } = useRouterState()
  const [showPicker, setShowPicker] = useState(false)
  const { profile } = useAuth()
  const online = useOnlineStatus()
  const accountActive = location.pathname === '/account'

  return (
    <>
      <aside className="hidden tablet:flex flex-col w-[72px] lg:w-[232px] shrink-0 h-dvh bg-cream-50 border-r border-cream-200">
        {/* Wordmark */}
        <div className="h-14 flex items-center gap-1 px-1.5 border-b border-cream-200 shrink-0">
          <img src="/icons/icon-no-bg.svg" alt="" className="size-14 shrink-0" />
          <span className="hidden lg:inline font-display text-2xl font-medium text-wood-800 tracking-tight truncate">
            Apidiario
          </span>
        </div>

        {/* Nuova ispezione */}
        <div className="px-2.5 pt-3 pb-1">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            title="Nuova ispezione"
            className="w-full h-11 rounded-md bg-honey-500 text-cream-50 shadow-fab flex items-center justify-center lg:justify-start gap-2 px-0 lg:px-3 hover:bg-honey-600 active:bg-honey-700 transition-colors duration-150"
          >
            <ClipboardCheck size={20} strokeWidth={2} aria-hidden="true" />
            <span className="hidden lg:inline text-sm font-medium">Nuova ispezione</span>
          </button>
        </div>

        {/* Voci di navigazione */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2" aria-label="Navigazione principale">
          <ul className="flex flex-col gap-0.5" role="list">
            {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => {
              const active = match(location.pathname)
              return (
                <li key={to}>
                  <Link
                    to={to}
                    title={label}
                    className={cn(
                      'flex items-center gap-3 min-h-11 rounded-md px-2.5 lg:px-3 justify-center lg:justify-start transition-colors duration-150',
                      active ? 'bg-honey-tint text-honey-700 font-semibold' : 'text-wood-500 font-medium hover:bg-cream-100',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={20} strokeWidth={1.75} className={active ? 'text-honey-600' : undefined} aria-hidden="true" />
                    <span className="hidden lg:inline text-sm">{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Account — Link normale, stesso trattamento delle altre voci */}
        <Link
          to="/account"
          title="Account"
          aria-current={accountActive ? 'page' : undefined}
          className={cn(
            'shrink-0 border-t border-cream-200 px-2.5 py-3 flex items-center gap-2.5 transition-colors duration-150',
            accountActive ? 'bg-honey-tint' : 'hover:bg-cream-100',
          )}
        >
          <span className={cn(
            'size-8 rounded-full flex items-center justify-center shrink-0',
            accountActive ? 'bg-honey-500 text-cream-50' : 'bg-cream-200 text-wood-600',
          )}>
            <User size={16} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="hidden lg:flex flex-col min-w-0">
            <span className={cn('text-sm truncate', accountActive ? 'font-semibold text-honey-700' : 'font-medium text-wood-800')}>
              {profile?.display_name || 'Account'}
            </span>
            <span className="flex items-center gap-1 text-xs text-success-500">
              <span className={cn('size-1.5 rounded-full', online ? 'bg-success-500' : 'bg-wood-400')} aria-hidden="true" />
              {online ? 'Sincronizzato' : 'Offline'}
            </span>
          </span>
        </Link>
      </aside>

      <HivePickerSheet open={showPicker} onClose={() => setShowPicker(false)} />
    </>
  )
}
