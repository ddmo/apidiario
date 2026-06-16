import type { Suggestion } from '@/lib/suggestions/types'
import { SeverityBadge } from './severity-badge'

interface SuggestionItemProps {
  suggestion: Suggestion
}

export function SuggestionItem({ suggestion }: SuggestionItemProps) {
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
      </div>
    </div>
  )
}
