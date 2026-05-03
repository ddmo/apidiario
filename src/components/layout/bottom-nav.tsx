import { Link, useRouterState } from '@tanstack/react-router'
import { Trees, Box, House, Bell, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n/it'

// Le route /apiari, /arnie, /promemoria, /altro verranno aggiunte nelle fasi successive
const navItems = [
  { href: '/apiari', label: t.nav.apiari, icon: Trees },
  { href: '/arnie', label: t.nav.arnie, icon: Box },
  { href: '/home', label: t.nav.home, icon: House, routerTo: '/home' as const },
  { href: '/promemoria', label: t.nav.promemoria, icon: Bell },
  { href: '/altro', label: t.nav.altro, icon: MoreHorizontal },
] as const

export function BottomNav() {
  const { location } = useRouterState()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 h-16 bg-cream-50 border-t border-cream-200 shadow-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigazione principale"
    >
      <ul className="flex h-full items-center" role="list">
        {navItems.map(({ href, label, icon: Icon, ...item }) => {
          const active = location.pathname === href
          const isRouted = 'routerTo' in item

          const content = (
            <>
              <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
              <span className="text-xs font-medium">{label}</span>
            </>
          )

          const baseClass = cn(
            'flex flex-col items-center gap-1 py-2 w-full min-h-[44px] justify-center',
            'transition-colors duration-150',
            active ? 'text-honey-500' : 'text-wood-500',
          )

          return (
            <li key={href} className="flex-1">
              {isRouted ? (
                <Link to={item.routerTo} className={baseClass} aria-current={active ? 'page' : undefined}>
                  {content}
                </Link>
              ) : (
                <a href={href} className={baseClass} aria-current={active ? 'page' : undefined}>
                  {content}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
