import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type ActivityLogEntry = {
  id: string
  userId: string
  displayName: string
  action: string
  entityType: string
  description: string
  createdAt: string
}

type ActivityLogRow = Tables<'activity_log'> & {
  profiles: { display_name: string } | { display_name: string }[]
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

      return (data as unknown as ActivityLogRow[]).map((row: ActivityLogRow) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
          id: row.id,
          userId: row.user_id,
          displayName: profile?.display_name ?? '',
          action: row.action,
          entityType: row.entity_type,
          description: row.description,
          createdAt: row.created_at,
        }
      })
    },
  })
}
