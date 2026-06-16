import type { Suggestion } from '@/lib/suggestions/types'
import { SeverityBadge } from './severity-badge'

interface SuggestionItemProps {
  suggestion: Suggestion
}

export function SuggestionItem({ suggestion }: SuggestionItemProps) {
  return (
    <div className="py-2.5 px-3 border-b border-cream-200/60 last:border-b-0">
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={suggestion.severity} />
        <h4 className="text-sm font-medium text-wood-800 leading-snug">
          {suggestion.title}
        </h4>
      </div>
      <p className="text-sm text-wood-500 leading-relaxed mt-1">
        {suggestion.description}
      </p>
    </div>
  )
}
