import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface SegmentedControlProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  dirty?: boolean
}

export function SegmentedControl({ options, value, onChange, ariaLabel, dirty = true }: SegmentedControlProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex items-center bg-cream-200 p-1 rounded-md w-full">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 h-10 px-3 text-sm font-medium rounded transition-colors duration-150',
              active && dirty && 'bg-cream-50 shadow-xs text-wood-800',
              active && !dirty && 'bg-cream-50/60 text-wood-700 border border-dashed border-honey-500/60',
              !active && 'text-wood-500 hover:text-wood-700',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
