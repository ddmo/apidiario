import { useMemo, useState } from 'react'
import { LayoutList, Layers } from 'lucide-react'
import { useApiarySuggestions } from '../hooks/use-apiary-suggestions'
import { useSuggestionFilters } from '../hooks/use-suggestion-filters'
import { ALL_SUGGESTION_FILTER_KEYS, isSuggestionVisible } from '@/lib/suggestions/suggestion-filter-constants'
import { HiveSuggestionCard } from './hive-suggestion-card'
import { SuggestionGroupCard, type SuggestionGroup } from './suggestion-group-card'
import type { Suggestion } from '@/lib/suggestions/types'

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 }
const CATEGORY_ORDER: Record<string, number> = {
  queen: 0, brood: 1, population: 2, health: 3, swarming: 4,
  stores: 5, equipment: 6, harvest: 7, schedule: 8, season: 9, behavior: 10,
}

function groupBySuggestion(
  filtered: { hive: Parameters<typeof HiveSuggestionCard>[0]['data']['hive']; suggestions: Suggestion[] }[],
): SuggestionGroup[] {
  const map = new Map<string, SuggestionGroup>()
  for (const { hive, suggestions } of filtered) {
    for (const s of suggestions) {
      if (!map.has(s.id)) {
        map.set(s.id, { suggestion: s, hives: [] })
      }
      map.get(s.id)!.hives.push(hive)
    }
  }
  return [...map.values()].sort((a, b) => {
    const sev = (SEVERITY_ORDER[a.suggestion.severity] ?? 3) - (SEVERITY_ORDER[b.suggestion.severity] ?? 3)
    if (sev !== 0) return sev
    return (CATEGORY_ORDER[a.suggestion.category] ?? 99) - (CATEGORY_ORDER[b.suggestion.category] ?? 99)
  })
}

/** Contenuto suggerimenti per un apiario — riusato dalla route /suggerimenti e dal pannello preview desktop. */
export function SuggestionsContent({ apiaryId }: { apiaryId: string }) {
  const { data: result, isLoading: isLoadingSuggestions, isError } = useApiarySuggestions(apiaryId)
  const enabledFilters = useSuggestionFilters()
  const isLoading = isLoadingSuggestions || enabledFilters === undefined
  const enabledSet = useMemo(
    () => new Set(enabledFilters ?? ALL_SUGGESTION_FILTER_KEYS),
    [enabledFilters],
  )

  const [viewMode, setViewMode] = useState<'hive' | 'grouped'>(
    () => (localStorage.getItem('suggerimenti-view-mode') as 'hive' | 'grouped') ?? 'hive',
  )

  function changeViewMode(mode: 'hive' | 'grouped') {
    localStorage.setItem('suggerimenti-view-mode', mode)
    setViewMode(mode)
  }

  const filtered = useMemo(
    () =>
      result?.map((hs) => ({
        ...hs,
        suggestions: hs.suggestions.filter((s) => isSuggestionVisible(s.id, enabledSet)),
      })),
    [result, enabledSet],
  )

  const groups = useMemo(
    () => (filtered ? groupBySuggestion(filtered) : []),
    [filtered],
  )

  const hasNoSuggestions = !isLoading && filtered && filtered.length > 0 && filtered.every((hs) => hs.suggestions.length === 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label={viewMode === 'hive' ? 'Vista per avviso' : 'Vista per arnia'}
          onClick={() => changeViewMode(viewMode === 'hive' ? 'grouped' : 'hive')}
          className="size-9 flex items-center justify-center text-wood-500 hover:text-wood-800 hover:bg-cream-100 rounded-md transition-colors"
        >
          {viewMode === 'hive' ? <Layers size={18} strokeWidth={1.75} /> : <LayoutList size={18} strokeWidth={1.75} />}
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm text-wood-400">
          Caricamento suggerimenti…
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center justify-center py-12 text-sm text-danger-500 text-center px-4">
          Impossibile calcolare i suggerimenti per questo apiario. Riprova più tardi.
        </div>
      )}

      {!isLoading && !isError && filtered?.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-wood-400">
          Nessuna arnia in questo apiario
        </div>
      )}

      {!isLoading && !isError && hasNoSuggestions && (
        <p className="text-center text-sm text-wood-400 py-4">
          Non ci sono suggerimenti attivi per le arnie di questo apiario.
        </p>
      )}

      {!isLoading && !isError && !hasNoSuggestions && viewMode === 'hive' && filtered?.map((hs) => (
        <HiveSuggestionCard key={hs.hive.id} data={hs} />
      ))}

      {!isLoading && !isError && !hasNoSuggestions && viewMode === 'grouped' && groups.map((g) => (
        <SuggestionGroupCard key={g.suggestion.id} group={g} />
      ))}
    </div>
  )
}
