import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'
import { ALL_SUGGESTION_FILTER_KEYS } from '@/lib/suggestions/suggestion-filter-constants'

export function useSuggestionFilters(): string[] | undefined {
  const { session } = useAuth()

  const { data } = useQuery({
    queryKey: ['suggestionFilters', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return ALL_SUGGESTION_FILTER_KEYS
      const { data: row } = await supabase
        .from('user_inspection_preferences')
        .select('suggestion_filters')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (row?.suggestion_filters && Array.isArray(row.suggestion_filters)) {
        return row.suggestion_filters as string[]
      }
      return ALL_SUGGESTION_FILTER_KEYS
    },
    enabled: !!session?.user?.id,
    gcTime: 0,
  })

  return data
}

export function useUpdateSuggestionFilters() {
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (filters: string[]) => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_inspection_preferences')
        .upsert({ user_id: session.user.id, suggestion_filters: filters })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suggestionFilters'] })
    },
    onError: (err) => { console.error('[use-suggestion-filters.ts] mutation failed', err) },
  })
}
