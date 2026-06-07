import { cn } from '@/lib/utils'
import { QUEEN_CELL_OPTIONS, type QueenCellType } from '../types'

interface QueenCellsGridProps {
  title: string
  selected: QueenCellType[]
  onToggle: (value: QueenCellType) => void
  disabled?: QueenCellType[]
}

export function QueenCellsGrid({ title, selected, onToggle, disabled }: QueenCellsGridProps) {
  return (
    <div>
      <p className="text-xs font-medium text-wood-500 mb-1.5">{title}</p>
      <div className="grid grid-cols-4 gap-2">
        {QUEEN_CELL_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.value)
          const isDisabled = disabled?.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onToggle(opt.value)}
              className={cn(
                'h-14 rounded-lg border flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all duration-150',
                isSelected && 'bg-honey-300/60 border-honey-500 text-wood-800',
                !isSelected && !isDisabled && 'bg-cream-50 border-cream-200 text-wood-500 hover:border-wood-400/40',
                isDisabled && 'bg-cream-100 border-cream-200 text-wood-300 cursor-not-allowed opacity-50',
              )}
            >
              <span className="text-center leading-tight px-0.5">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
