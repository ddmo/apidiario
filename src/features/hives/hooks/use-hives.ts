import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import type { Database } from '@/types/database'

export type HiveListItem = {
  id: string
  identifier: string
  hiveType: Database['public']['Enums']['hive_type']
  beeRace: Database['public']['Enums']['bee_race']
}

export function useHivesByApiary(apiaryId: string) {
  return useQuery({
    queryKey: ['hives', apiaryId],
    queryFn: async (): Promise<HiveListItem[]> => {
      const { data, error } = await supabase
        .from('hives')
        .select('id, identifier, hive_type, bee_race')
        .eq('apiary_id', apiaryId)
        .is('archived_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data.map((r) => ({
        id: r.id,
        identifier: r.identifier,
        hiveType: r.hive_type,
        beeRace: r.bee_race,
      }))
    },
    enabled: !!apiaryId,
  })
}

type CreateHiveInput = {
  apiaryId: string
  identifier: string
  hiveType: Database['public']['Enums']['hive_type']
  beeRace: Database['public']['Enums']['bee_race']
  installedOn: string | null
  originNotes: string | null
  nidoFrameCount: number
  notes: string | null
}

export function useCreateHive() {
  return useMutation<string, Error, CreateHiveInput>({
    mutationFn: async ({
      apiaryId,
      identifier,
      hiveType,
      beeRace,
      installedOn,
      originNotes,
      nidoFrameCount,
      notes,
    }) => {
      const id = crypto.randomUUID()

      const { error } = await supabase.rpc('create_hive_with_queen', {
        p_id: id,
        p_apiary_id: apiaryId,
        p_identifier: identifier,
        p_hive_type: hiveType,
        p_bee_race: beeRace,
        p_installed_on: installedOn,
        p_origin_notes: originNotes,
        p_nido_frame_count: nidoFrameCount,
        p_notes: notes,
      })

      if (error) throw error

      return id
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['hives', variables.apiaryId] })
      void queryClient.invalidateQueries({ queryKey: ['apiaries'] })
    },
  })
}
