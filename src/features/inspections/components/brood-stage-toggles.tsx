import { cn } from '@/lib/utils'
import type { BroodState } from '../types'

function EggIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c-3.5 0-6 5-6 10a6 6 0 0 0 12 0c0-5-2.5-10-6-10z" />
    </svg>
  )
}

function LarvaIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 14c0-3 2.5-5 7-5s7 2 7 5-2.5 5-7 5-7-2-7-5z" />
      <path d="M9 12.5v3M13 12.5v3" />
    </svg>
  )
}

function CappedIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
    </svg>
  )
}

const STAGES: { key: keyof BroodState; label: string; icon: React.ReactNode }[] = [
  { key: 'uova', label: 'Uova', icon: <EggIcon /> },
  { key: 'larve', label: 'Larve', icon: <LarvaIcon /> },
  { key: 'opercolata', label: 'Opercolata', icon: <CappedIcon /> },
]

interface BroodStageTogglesProps {
  value: BroodState
  onChange: (value: BroodState) => void
  dirty?: boolean
}

export function BroodStageToggles({ value, onChange, dirty = true }: BroodStageTogglesProps) {
  const toggle = (key: keyof BroodState) => onChange({ ...value, [key]: value[key] ? null : true })

  return (
    <div className="grid grid-cols-3 gap-2">
      {STAGES.map((s) => {
        const on = value[s.key]
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(s.key)}
            className={cn(
              'h-[76px] rounded-lg border flex flex-col items-center justify-center gap-1 transition-all duration-150',
              on && dirty && 'bg-honey-300/60 border-honey-500 text-wood-800',
              on && !dirty && 'bg-honey-300/15 border-honey-500 border-dashed text-wood-700',
              !on && 'bg-cream-50 border-cream-200 text-wood-400 hover:border-wood-400/40',
            )}
          >
            {s.icon}
            <span className="text-xs font-medium">{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
