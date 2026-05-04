import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id: string
  error?: string
}

export function Input({ label, id, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-wood-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'h-12 rounded-md border border-cream-200 bg-cream-50 px-4',
          'text-base text-wood-700 placeholder:text-wood-400',
          'transition-colors duration-150',
          'focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20',
          'disabled:bg-cream-100 disabled:text-wood-300 disabled:cursor-not-allowed',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger-500">
          {error}
        </p>
      )}
    </div>
  )
}
