import { cn } from '@/lib/utils'
import type { QueenSeen } from '../types'

// CrownOff not in lucide-react@0.469 — minimal inline SVG
function CrownOffIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4l20 20" />
      <path d="M4 18l-1-9 4 3" />
      <path d="M22 18l-1-9-5 4" />
      <path d="M8 18h14" />
    </svg>
  )
}

function CrownIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 18h20M4 18l-1-9 5 4 4-7 4 7 5-4-1 9" />
    </svg>
  )
}

function HelpCircleIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .5-1 1.2-1 2" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  )
}

const OPTIONS: { value: QueenSeen; label: string; icon: React.ReactNode }[] = [
  { value: 'vista', label: 'Vista', icon: <CrownIcon /> },
  { value: 'non_vista', label: 'Non vista', icon: <CrownOffIcon /> },
  { value: 'non_cercata', label: 'Non cercata', icon: <HelpCircleIcon /> },
]

interface QueenSightingPickerProps {
  value: QueenSeen
  onChange: (value: QueenSeen) => void
  dirty?: boolean
}

export function QueenSightingPicker({ value, onChange, dirty = true }: QueenSightingPickerProps) {
  return (
    <div role="radiogroup" aria-label="Regina" className="grid grid-cols-3 gap-2">
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
              'h-[88px] rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all duration-150',
              active && dirty && 'bg-honey-300/60 border-honey-500 text-wood-800',
              active && !dirty && 'bg-honey-300/15 border-honey-500 border-dashed text-wood-700',
              !active && 'bg-cream-50 border-cream-200 text-wood-500 hover:border-wood-400/40',
            )}
          >
            {o.icon}
            <span className="text-xs font-medium">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
