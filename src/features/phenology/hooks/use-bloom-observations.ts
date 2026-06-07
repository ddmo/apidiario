import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type BloomObservation = {
  id: string
  apiary_id: string
  species_id: string
  year: number
  observed_start_date: string | null
  observed_end_date: string | null
  notes: string | null
  user_id: string
  created_at: string
  updated_at: string
}

type UpsertInput = {
  apiary_id: string
  species_id: string
  year: number
  observed_start_date: string | null
  observed_end_date: string | null
  notes?: string
}

export function useBloomObservations(apiaryId?: string, speciesId?: string) {
  return useQuery({
    queryKey: ['bloom-observations', apiaryId, speciesId],
    queryFn: async (): Promise<BloomObservation[]> => {
      let query = supabase
        .from('bloom_observations')
        .select('*')
        .eq('apiary_id', apiaryId!)
        .eq('species_id', speciesId!)
        .order('year', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!apiaryId && !!speciesId,
    staleTime: 1000 * 60,
  })
}

export function useUpsertBloomObservation(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpsertInput) => {
      const { data: existing } = await supabase
        .from('bloom_observations')
        .select('id')
        .eq('apiary_id', input.apiary_id)
        .eq('species_id', input.species_id)
        .eq('year', input.year)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('bloom_observations')
          .update({
            observed_start_date: input.observed_start_date,
            observed_end_date: input.observed_end_date,
            notes: input.notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) throw error
        return existing.id
      } else {
        const { data, error } = await supabase
          .from('bloom_observations')
          .insert({
            apiary_id: input.apiary_id,
            species_id: input.species_id,
            year: input.year,
            observed_start_date: input.observed_start_date,
            observed_end_date: input.observed_end_date,
            notes: input.notes ?? null,
            user_id: userId,
          })
          .select('id')
          .single()
        if (error) throw error
        return data!.id
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-observations'] })
    },
    onError: (err) => { console.error("[src/features/phenology/hooks/use-bloom-observations.ts] mutation failed", err) },
  })
}
