import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type InspectionRow = Tables<'inspections'>

export type InspectionListItem = Pick<
  InspectionRow,
  | 'id'
  | 'performed_at'
  | 'queen_seen'
  | 'population'
  | 'notes'
  | 'brood_frame_count'
  | 'pathologies'
  | 'melari_count'
  | 'behavior'
>

export function useInspectionsByHive(hiveId: string) {
  return useQuery({
    queryKey: ['inspections', hiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select(
          'id, performed_at, queen_seen, population, notes, brood_frame_count, pathologies, melari_count, behavior',
        )
        .eq('hive_id', hiveId)
        .order('performed_at', { ascending: false })
      if (error) throw error
      return data as InspectionListItem[]
    },
  })
}

export function useInspection(inspectionId: string) {
  return useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single()
      if (error) throw error
      return data as InspectionRow
    },
  })
}
