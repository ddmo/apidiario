import { useState } from 'react'
import { Info } from 'lucide-react'
import type { Suggestion } from '@/lib/suggestions/types'
import { SeverityBadge } from './severity-badge'

interface SuggestionItemProps {
  suggestion: Suggestion
}

export function SuggestionItem({ suggestion }: SuggestionItemProps) {
  const [showReason, setShowReason] = useState(false)

  return (
    <div className="py-2.5 px-3 border-b border-cream-200/60 last:border-b-0">
      <div className="flex items-start gap-2.5">
        <SeverityBadge severity={suggestion.severity} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-wood-800 leading-snug">
            {suggestion.title}
          </h4>
          <p className="text-sm sm:text-base text-wood-500 leading-relaxed mt-0.5">
            {suggestion.description}
          </p>
        </div>
        <button
          type="button"
          aria-label="Mostra dettaglio"
          onClick={() => setShowReason((v) => !v)}
          className="size-6 flex items-center justify-center text-wood-400 hover:text-wood-600 shrink-0 mt-0.5"
        >
          <Info size={14} strokeWidth={1.5} />
        </button>
      </div>
      {showReason && (
        <p className="mt-1.5 text-xs text-wood-400 leading-relaxed pl-[calc(theme(spacing[2])+theme(spacing[2.5])+var(--badge-width,56px))]">
          {suggestion.reason}
        </p>
      )}
    </div>
  )
}
