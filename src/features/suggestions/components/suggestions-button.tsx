import { Link } from '@tanstack/react-router'
import { Lightbulb } from 'lucide-react'

interface SuggestionsButtonProps {
  apiaryId: string
  criticalCount?: number
}

export function SuggestionsButton({ apiaryId, criticalCount }: SuggestionsButtonProps) {
  return (
    <Link
      to="/apiaries/$apiaryId/suggerimenti"
      params={{ apiaryId }}
      className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors relative"
    >
      <Lightbulb size={22} strokeWidth={1.75} />
      {criticalCount != null && criticalCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-cream-50 px-1 leading-none">
          {criticalCount}
        </span>
      )}
    </Link>
  )
}
