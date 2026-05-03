import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FrameCounterProps {
  label: string
  value: number
  onChange: (value: number) => void
  dirty?: boolean
  min?: number
  max?: number
}

export function FrameCounter({ label, value, onChange, dirty = true, min = 0, max = 20 }: FrameCounterProps) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div className="flex items-center gap-3 bg-cream-50 border border-cream-200 rounded-md h-12 pl-4 pr-1">
      <span className="text-sm font-medium text-wood-700 flex-1">{label}</span>
      <div className="flex items-center">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label={`Diminuisci ${label}`}
          className="size-11 flex items-center justify-center text-wood-500 hover:text-wood-700 active:bg-cream-200 rounded transition-colors disabled:text-wood-300 disabled:pointer-events-none"
        >
          <Minus size={20} />
        </button>
        <span
          className={cn(
            'text-xl font-semibold tracking-tight min-w-[24px] text-center tabular-nums',
            dirty ? 'text-wood-800' : 'text-wood-500',
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label={`Aumenta ${label}`}
          className="size-11 flex items-center justify-center text-wood-500 hover:text-wood-700 active:bg-cream-200 rounded transition-colors disabled:text-wood-300 disabled:pointer-events-none"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}
