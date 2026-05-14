import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'

export function useApiarySpecies(apiaryId: string) {
  return useQuery({
    queryKey: ['apiary-species', apiaryId],
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await supabase
        .from('apiary_species')
        .select('species_id')
        .eq('apiary_id', apiaryId)
      return new Set(data?.map((d) => d.species_id) ?? [])
    },
    enabled: !!apiaryId,
  })
}

export function useSetApiarySpecies() {
  return useMutation({
    mutationFn: async ({ apiaryId, speciesIds }: { apiaryId: string; speciesIds: string[] }) => {
      await supabase.from('apiary_species').delete().eq('apiary_id', apiaryId)
      if (speciesIds.length > 0) {
        await supabase.from('apiary_species').insert(
          speciesIds.map((speciesId) => ({ apiary_id: apiaryId, species_id: speciesId })),
        )
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['apiary-species', variables.apiaryId] })
      void queryClient.invalidateQueries({ queryKey: ['home-alerts', 'bloom-v2'] })
    },
  })
}
