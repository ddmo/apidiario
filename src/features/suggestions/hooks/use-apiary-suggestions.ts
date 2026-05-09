import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateSuggestions } from '@/lib/suggestions/engine'
import type { Suggestion, SuggestionContext, Hive, Inspection } from '@/lib/suggestions/types'

export interface HiveSuggestions {
  hive: Hive
  lastInspection: Inspection | null
  suggestions: Suggestion[]
}

export function computeSuggestions(
  hives: Hive[],
  inspections: Inspection[],
  today: Date,
): HiveSuggestions[] {
  const latestInspMap = new Map<string, Inspection>()
  for (const insp of inspections) {
    if (!latestInspMap.has(insp.hive_id)) {
      latestInspMap.set(insp.hive_id, insp)
    }
  }

  return hives.map((hive) => {
    const lastInspection = latestInspMap.get(hive.id) ?? null
    const ctx: SuggestionContext = {
      hive,
      lastInspection,
      daysSinceLastInspection: lastInspection
        ? Math.floor(
            (today.getTime() - new Date(lastInspection.performed_at).getTime()) /
              86_400_000,
          )
        : null,
      today,
    }

    return {
      hive,
      lastInspection,
      suggestions: generateSuggestions(ctx),
    }
  })
}

export function useApiarySuggestions(apiaryId: string) {
  return useQuery({
    queryKey: ['apiary-suggestions', apiaryId],
    queryFn: async (): Promise<HiveSuggestions[]> => {
      const { data: hivesData, error: hivesError } = await supabase
        .from('hives')
        .select('*')
        .eq('apiary_id', apiaryId)
        .is('archived_at', null)
        .order('identifier', { ascending: true })

      if (hivesError) throw hivesError
      if (!hivesData?.length) return []

      const hiveIds = hivesData.map((h) => h.id)

      const { data: inspData } = await supabase
        .from('inspections')
        .select('*')
        .in('hive_id', hiveIds)
        .order('performed_at', { ascending: false })

      return computeSuggestions(
        hivesData as Hive[],
        (inspData ?? []) as Inspection[],
        new Date(),
      )
    },
    enabled: !!apiaryId,
    staleTime: 0,
  })
}
