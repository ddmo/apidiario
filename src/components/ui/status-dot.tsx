import { cn } from '@/lib/utils'

type Status = 'success' | 'warning' | 'danger' | 'neutral'

interface StatusDotProps {
  status: Status
  label: string
  showLabel?: boolean
  className?: string
}

const dotClasses: Record<Status, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  neutral: 'bg-wood-400',
}

export function StatusDot({ status, label, showLabel = false, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('inline-block size-2 rounded-full shrink-0', dotClasses[status])}
        aria-hidden="true"
      />
      <span className={showLabel ? 'text-sm text-wood-500' : 'sr-only'}>{label}</span>
    </span>
  )
}
