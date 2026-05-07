import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Trees, Box, Plus, Calendar, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n/it'
import { HivePickerSheet } from '@/features/inspections/components/hive-picker-sheet'

export function BottomNav() {
  const { location } = useRouterState()
  const [showPicker, setShowPicker] = useState(false)

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 h-16 bg-cream-50 border-t border-cream-200 shadow-sm"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigazione principale"
      >
        <ul className="flex h-full items-center" role="list">
          {/* Apiari — home at / */}
          <li className="flex-1">
            <Link
              to="/"
              className={cn(
                'flex flex-col items-center gap-1 py-2 w-full min-h-[44px] justify-center transition-colors duration-150',
                location.pathname === '/' ? 'text-honey-500' : 'text-wood-500',
              )}
              aria-current={location.pathname === '/' ? 'page' : undefined}
            >
              <Trees size={24} strokeWidth={1.75} aria-hidden="true" />
              <span className="text-xs font-medium">{t.nav.apiari}</span>
            </Link>
          </li>

          {/* Arnie */}
          <li className="flex-1">
            <Link
              to="/arnie"
              className={cn(
                'flex flex-col items-center gap-1 py-2 w-full min-h-[44px] justify-center transition-colors duration-150',
                location.pathname === '/arnie' ? 'text-honey-500' : 'text-wood-500',
              )}
              aria-current={location.pathname === '/arnie' ? 'page' : undefined}
            >
              <Box size={24} strokeWidth={1.75} aria-hidden="true" />
              <span className="text-xs font-medium">{t.nav.arnie}</span>
            </Link>
          </li>

          {/* Visita — primary action */}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex flex-col items-center gap-1 py-2 w-full min-h-[44px] justify-center"
              aria-label="Nuova ispezione"
            >
              <span className="size-11 rounded-full bg-honey-500 flex items-center justify-center shadow-sm -mt-4">
                <Plus size={24} strokeWidth={2.5} className="text-cream-50" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-honey-600">{t.nav.visita}</span>
            </button>
          </li>

          {/* Calendario */}
          <li className="flex-1">
            <Link
              to="/calendario"
              className={cn(
                'flex flex-col items-center gap-1 py-2 w-full min-h-[44px] justify-center transition-colors duration-150',
                location.pathname === '/calendario' ? 'text-honey-500' : 'text-wood-500',
              )}
              aria-current={location.pathname === '/calendario' ? 'page' : undefined}
            >
              <Calendar size={24} strokeWidth={1.75} aria-hidden="true" />
              <span className="text-xs font-medium">{t.nav.calendario}</span>
            </Link>
          </li>

          {/* Più */}
          <li className="flex-1">
            <a
              href="/piu"
              className={cn(
                'flex flex-col items-center gap-1 py-2 w-full min-h-[44px] justify-center transition-colors duration-150',
                'text-wood-500',
              )}
            >
              <MoreHorizontal size={24} strokeWidth={1.75} aria-hidden="true" />
              <span className="text-xs font-medium">{t.nav.altro}</span>
            </a>
          </li>
        </ul>
      </nav>

      <HivePickerSheet open={showPicker} onClose={() => setShowPicker(false)} />
    </>
  )
}
