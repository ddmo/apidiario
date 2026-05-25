import { cn } from '@/lib/utils'
import type { Severity } from '@/lib/suggestions/types'

interface SeverityBadgeProps {
  severity: Severity
  className?: string
}

const config: Record<Severity, { label: string; classes: string }> = {
  critical: { label: 'Critico', classes: 'bg-danger-100 text-danger-500' },
  warning: { label: 'Attenzione', classes: 'bg-warning-100 text-warning-500' },
  info: { label: 'Info', classes: 'bg-cream-200 text-wood-500' },
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const { label, classes } = config[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium leading-none shrink-0',
        classes,
        className,
      )}
    >
      {label}
    </span>
  )
}
