import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProfilesList() {
  return useQuery({
    queryKey: ['admin', 'profiles-list'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .order('display_name')
      if (error) throw error
      return data
    },
  })
}
