import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { HarvestInsert, HarvestUpdate, HarvestListItem } from '../types'

const HARVESTS_KEY = 'harvests'

function buildHarvestListQuery() {
  return supabase
    .from('harvests')
    .select('*, apiaries(name)')
    .order('harvested_on', { ascending: false })
}

export function useHarvests() {
  return useQuery({
    queryKey: [HARVESTS_KEY],
    queryFn: async () => {
      const { data, error } = await buildHarvestListQuery()
      if (error) throw error
      return (data ?? []).map((h) => ({
        id: h.id,
        apiary_id: h.apiary_id,
        harvested_on: h.harvested_on,
        honey_type: h.honey_type,
        total_kg: h.total_kg,
        humidity_pct: h.humidity_pct,
        batch_code: h.batch_code,
        notes: h.notes,
        apiary_name: (h.apiaries as { name: string } | null)?.name ?? null,
      })) satisfies HarvestListItem[]
    },
  })
}

export function useHarvest(id: string | undefined) {
  return useQuery({
    queryKey: [HARVESTS_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('harvests')
        .select('*, apiaries(name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return {
        ...data,
        apiary_name: (data.apiaries as { name: string } | null)?.name ?? null,
      } as HarvestListItem & { recorded_by: string; created_at: string; updated_at: string }
    },
  })
}

export function useCreateHarvest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: HarvestInsert) => {
      const { data, error } = await supabase.from('harvests').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HARVESTS_KEY] })
    },
  })
}

export function useUpdateHarvest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: HarvestUpdate & { id: string }) => {
      const { data, error } = await supabase.from('harvests').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HARVESTS_KEY] })
    },
  })
}

export function useDeleteHarvest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('harvests').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Nessun raccolto eliminato. Verifica i permessi.')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HARVESTS_KEY] })
    },
  })
}
