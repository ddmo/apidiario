import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-honey-500 text-cream-50 hover:bg-honey-600 active:bg-honey-700',
  secondary:
    'bg-cream-200 text-wood-700 border border-wood-400/40 hover:bg-cream-100',
  ghost: 'bg-transparent text-wood-700 hover:bg-cream-100',
  destructive: 'bg-danger-500 text-cream-50 hover:bg-danger-500/90',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base', // 44px — touch-friendly
  lg: 'h-13 px-6 text-base', // 52px
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-150 select-none',
        'focus-visible:outline-2 focus-visible:outline-honey-500 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      )}
      {children}
    </button>
  )
}
