import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateSuggestions } from '@/lib/suggestions/engine'
import type { Suggestion, SuggestionContext, Hive, Inspection, Reminder } from '@/lib/suggestions/types'

export interface HiveSuggestions {
  hive: Hive
  lastInspection: Inspection | null
  suggestions: Suggestion[]
}

export function computeSuggestions(
  hives: Hive[],
  inspections: Inspection[],
  today: Date,
  reminders: Reminder[] = [],
): HiveSuggestions[] {
  const latestInspMap = new Map<string, Inspection>()
  const hiveInspectionsMap = new Map<string, Inspection[]>()
  for (const insp of inspections) {
    if (!latestInspMap.has(insp.hive_id)) {
      latestInspMap.set(insp.hive_id, insp)
    }
    const list = hiveInspectionsMap.get(insp.hive_id) ?? []
    list.push(insp)
    hiveInspectionsMap.set(insp.hive_id, list)
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
      reminders,
      recentInspections: hiveInspectionsMap.get(hive.id) ?? [],
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

      // Fetch active reminders for this apiary.
      // RLS policy already filters by auth.uid() — no need to filter by userId explicitly.
      const { data: reminderRows } = await supabase
        .from('reminders')
        .select('*')
        .is('completed_at', null)
        .order('due_at', { ascending: true })

      let remindersData: Reminder[] = []
      if (reminderRows?.length) {
        remindersData = (reminderRows as unknown as Reminder[]).filter(
          (r) =>
            r.scope === 'global' ||
            r.apiary_id === apiaryId ||
            (r.hive_id && hiveIds.includes(r.hive_id)),
        )
      }

      return computeSuggestions(
        hivesData as Hive[],
        (inspData ?? []) as Inspection[],
        new Date(),
        remindersData,
      )
    },
    enabled: !!apiaryId,
    staleTime: 0,
  })
}
