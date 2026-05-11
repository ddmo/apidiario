import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type ActivityLogEntry = {
  id: string
  userId: string
  displayName: string
  action: string
  entityType: string
  description: string
  createdAt: string
}

export function useActivityLog() {
  return useQuery({
    queryKey: ['activityLog'],
    staleTime: 0,
    queryFn: async (): Promise<ActivityLogEntry[]> => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, user_id, action, entity_type, description, created_at, profiles!inner(display_name)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return (data as unknown[]).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        displayName: Array.isArray(row.profiles)
          ? row.profiles[0]?.display_name ?? ''
          : (row.profiles as { display_name: string })?.display_name ?? '',
        action: row.action,
        entityType: row.entity_type,
        description: row.description,
        createdAt: row.created_at,
      }))
    },
  })
}
