import { cn } from '@/lib/utils'

type SemanticColor = 'success' | 'warning' | 'danger' | 'honey' | 'wood'
type Size = 'sm' | 'md'

interface IconBadgeProps {
  icon: React.ReactNode
  color?: SemanticColor
  size?: Size
  label?: string
  className?: string
}

const colorClasses: Record<SemanticColor, string> = {
  success: 'bg-success-100 text-success-500',
  warning: 'bg-warning-100 text-warning-500',
  danger: 'bg-danger-100 text-danger-500',
  honey: 'bg-honey-300/30 text-honey-600',
  wood: 'bg-cream-200 text-wood-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'size-8',  // 32×32
  md: 'size-10', // 40×40
}

export function IconBadge({ icon, color = 'wood', size = 'sm', label, className }: IconBadgeProps) {
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cn(
        'flex items-center justify-center rounded-full shrink-0',
        colorClasses[color],
        sizeClasses[size],
        className,
      )}
    >
      {icon}
    </div>
  )
}
