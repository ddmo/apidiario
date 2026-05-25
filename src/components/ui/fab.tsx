import type { ReactNode } from 'react'

interface FabProps {
  icon: ReactNode
  label: string
  onClick: () => void
  position?: 'bottom-right' | 'bottom-center'
}

export function Fab({ icon, label, onClick, position = 'bottom-right' }: FabProps) {
  const posClass =
    position === 'bottom-center' ? 'left-1/2 -translate-x-1/2' : 'right-4'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`fixed ${posClass} z-20 size-14 rounded-full bg-honey-500 text-cream-50 flex items-center justify-center hover:bg-honey-600 active:bg-honey-700 active:scale-[0.97] transition-colors duration-150`}
      style={{
        bottom: 'calc(64px + 16px + env(safe-area-inset-bottom))',
        boxShadow: 'var(--shadow-fab)',
      }}
    >
      {icon}
    </button>
  )
}
