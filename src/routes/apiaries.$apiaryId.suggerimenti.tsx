import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { ArrowLeft, LayoutList, Layers } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getAuthUser } from '@/lib/auth-guard'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { useApiarySuggestions } from '@/features/suggestions/hooks/use-apiary-suggestions'
import { useSuggestionFilters } from '@/features/suggestions/hooks/use-suggestion-filters'
import { ALL_SUGGESTION_FILTER_KEYS, isSuggestionVisible } from '@/lib/suggestions/suggestion-filter-constants'
import { HiveSuggestionCard } from '@/features/suggestions/components/hive-suggestion-card'
import { SuggestionGroupCard, type SuggestionGroup } from '@/features/suggestions/components/suggestion-group-card'
import type { Suggestion } from '@/lib/suggestions/types'

export const Route = createFileRoute('/apiaries/$apiaryId/suggerimenti')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: SuggerimentiPage,
})

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

function SuggerimentiPage() {
  const { apiaryId } = Route.useParams()
  const router = useRouter()
  const { data: apiary } = useApiary(apiaryId)
  const { data: result, isLoading: isLoadingSuggestions } = useApiarySuggestions(apiaryId)
  const enabledFilters = useSuggestionFilters()
  const isLoading = isLoadingSuggestions || enabledFilters === undefined
  const enabledSet = useMemo(
    () => new Set(enabledFilters ?? ALL_SUGGESTION_FILTER_KEYS),
    [enabledFilters],
  )

  const [viewMode, setViewMode] = useState<'hive' | 'grouped'>('hive')

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
    <main className="h-dvh flex flex-col bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => router.history.back()}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Suggerimenti {apiary?.name ?? '…'}
        </h1>
        <button
          type="button"
          aria-label={viewMode === 'hive' ? 'Vista per avviso' : 'Vista per arnia'}
          onClick={() => setViewMode((m) => (m === 'hive' ? 'grouped' : 'hive'))}
          className="size-11 flex items-center justify-center text-wood-500 hover:text-wood-800 hover:bg-cream-100 rounded-md transition-colors"
        >
          {viewMode === 'hive' ? <Layers size={20} strokeWidth={1.75} /> : <LayoutList size={20} strokeWidth={1.75} />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-sm text-wood-400">
              Caricamento suggerimenti…
            </div>
          )}

          {!isLoading && filtered?.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-wood-400">
              Nessuna arnia in questo apiario
            </div>
          )}

          {!isLoading && hasNoSuggestions && (
            <p className="text-center text-sm text-wood-400 py-4">
              Non ci sono suggerimenti attivi per le arnie di questo apiario.
            </p>
          )}

          {!isLoading && !hasNoSuggestions && viewMode === 'hive' && filtered?.map((hs) => (
            <HiveSuggestionCard key={hs.hive.id} data={hs} />
          ))}

          {!isLoading && !hasNoSuggestions && viewMode === 'grouped' && groups.map((g) => (
            <SuggestionGroupCard key={g.suggestion.id} group={g} />
          ))}
        </div>
      </div>
    </main>
  )
}
