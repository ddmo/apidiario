import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
> & {
  performed_by?: string | null
  performer_display_name?: string | null
}

export function useInspectionsByHive(hiveId: string) {
  return useQuery({
    queryKey: ['inspections', hiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select(
          'id, performed_at, queen_seen, population, notes, brood_frame_count, pathologies, melari_count, behavior, performed_by, profiles!inner(display_name)',
        )
        .eq('hive_id', hiveId)
        .order('performed_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
          id: row.id,
          performed_at: row.performed_at,
          queen_seen: row.queen_seen,
          population: row.population,
          notes: row.notes,
          brood_frame_count: row.brood_frame_count,
          pathologies: row.pathologies,
          melari_count: row.melari_count,
          behavior: row.behavior,
          performed_by: row.performed_by,
          performer_display_name: (profile as { display_name: string } | null)?.display_name ?? null,
        } as InspectionListItem
      })
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

export function useDeleteInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ inspectionId, hiveId }: { inspectionId: string; hiveId: string }) => {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', inspectionId)
      if (error) throw error
      return { inspectionId, hiveId }
    },
    onSuccess: ({ hiveId }) => {
      void queryClient.invalidateQueries({ queryKey: ['inspections', hiveId] })
      void queryClient.invalidateQueries({ queryKey: ['lastInspection', hiveId] })
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
    },
  })
}
