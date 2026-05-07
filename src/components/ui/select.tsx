import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  id: string
  options: SelectOption[]
  error?: string
}

export function Select({ label, id, options, error, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-wood-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'h-12 rounded-md border border-cream-200 bg-cream-50 px-4',
          'text-base text-wood-700',
          'transition-colors duration-150',
          'focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20',
          'disabled:bg-cream-100 disabled:text-wood-300 disabled:cursor-not-allowed',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger-500">
          {error}
        </p>
      )}
    </div>
  )
}
