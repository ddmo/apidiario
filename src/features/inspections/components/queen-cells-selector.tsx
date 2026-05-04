import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/ui/status-dot'
import type { QueenCells } from '../types'

type DotStatus = 'success' | 'warning' | 'danger' | 'neutral'

const OPTIONS: { value: QueenCells; label: string; status: DotStatus }[] = [
  { value: 'nessuna', label: 'Nessuna', status: 'neutral' },
  { value: 'scorta', label: 'Di scorta', status: 'neutral' },
  { value: 'sciamatura', label: 'Sciamatura', status: 'warning' },
  { value: 'sostituzione', label: 'Sostituzione', status: 'danger' },
]

interface QueenCellsSelectorProps {
  value: QueenCells
  onChange: (value: QueenCells) => void
  dirty?: boolean
}

export function QueenCellsSelector({ value, onChange, dirty = true }: QueenCellsSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Celle reali" className="grid grid-cols-2 gap-2">
      {OPTIONS.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-12 rounded-md border flex items-center gap-2.5 px-3 transition-all duration-150',
              active && dirty && 'bg-honey-300/60 border-honey-500 text-wood-800',
              active && !dirty && 'bg-honey-300/15 border-honey-500 border-dashed text-wood-700',
              !active && 'bg-cream-50 border-cream-200 text-wood-500 hover:border-wood-400/40',
            )}
          >
            <StatusDot status={o.status} label={o.label} />
            <span className="text-sm font-medium">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
