import type { ReactNode } from 'react'
import { Button } from './button'
import { Plus } from 'lucide-react'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: ReactNode
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <div className="text-wood-300 mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-wood-700 mb-1.5">{title}</h2>
      {description && (
        <p className="text-sm sm:text-base text-wood-500 max-w-[260px] leading-relaxed mb-6">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant ?? 'primary'}
          size="md"
          onClick={action.onClick}
        >
          {action.icon ?? <Plus size={18} strokeWidth={1.75} aria-hidden="true" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
