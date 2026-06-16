import type { Suggestion } from '@/lib/suggestions/types'
import type { Hive } from '@/lib/suggestions/types'
import { SeverityBadge } from './severity-badge'

export interface SuggestionGroup {
  suggestion: Suggestion
  hives: Hive[]
}

interface SuggestionGroupCardProps {
  group: SuggestionGroup
}

export function SuggestionGroupCard({ group }: SuggestionGroupCardProps) {
  const { suggestion, hives } = group

  return (
    <div className="bg-cream-100 border border-cream-200 rounded-xl overflow-hidden">
      <div className="py-2.5 px-3">
        <div className="flex items-start gap-2.5">
          <SeverityBadge severity={suggestion.severity} className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-wood-800 leading-snug">
              {suggestion.title}
            </h4>
            <p className="text-sm text-wood-500 leading-relaxed mt-0.5">
              {suggestion.description}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {hives.map((hive) => (
            <span
              key={hive.id}
              className="inline-flex items-center px-2.5 py-1 rounded-md bg-cream-200 text-xs font-medium text-wood-700"
            >
              Arnia {hive.identifier}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
