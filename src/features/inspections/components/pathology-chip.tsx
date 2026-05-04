import { cn } from '@/lib/utils'

type Tone = 'danger' | 'honey'

interface PathologyChipProps {
  label: string
  selected: boolean
  onClick: () => void
  dirty?: boolean
  tone?: Tone
}

const TONE_CLASSES: Record<Tone, { solid: string; tenue: string }> = {
  danger: {
    solid: 'bg-danger-100 border-danger-500/40 text-danger-500',
    tenue: 'bg-danger-100/40 border-danger-500/40 border-dashed text-danger-500',
  },
  honey: {
    solid: 'bg-honey-300/60 border-honey-500 text-wood-800',
    tenue: 'bg-honey-300/15 border-honey-500 border-dashed text-wood-700',
  },
}

export function PathologyChip({ label, selected, onClick, dirty = true, tone = 'danger' }: PathologyChipProps) {
  const t = TONE_CLASSES[tone]
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'h-9 px-3.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0',
        selected && dirty && t.solid,
        selected && !dirty && t.tenue,
        !selected && 'bg-cream-50 border-cream-200 text-wood-500 hover:text-wood-700 hover:border-wood-400/40',
      )}
    >
      {label}
    </button>
  )
}
