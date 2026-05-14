import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export type ActivityTag =
  | { type: 'queen_seen'; label: string }
  | { type: 'population'; label: string }
  | { type: 'melari'; label: string }

export type ActivityItem = {
  id: string
  hiveId: string
  hiveIdentifier: string
  apiaryId: string
  apiaryName: string
  inspectorId: string
  inspectorName: string
  inspectedAt: string
  tags: ActivityTag[]
}

export function useRecentActivityByOthers() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('inspections')
        .select(`
          id, hive_id, performed_at, performed_by,
          queen_seen, population, honey_frame_count,
          hives!inner(identifier, apiary_id, apiaries!inner(name)),
          profiles!inner(display_name)
        `)
        .gte('performed_at', sevenDaysAgo.toISOString())
        .neq('performed_by', session?.user?.id ?? '')
        .order('performed_at', { ascending: false })
        .limit(20)

      if (error) throw error
      if (!data?.length) return []

      return (data as unknown as {
        id: string
        hive_id: string
        performed_at: string
        performed_by: string
        queen_seen: string | null
        population: string | null
        honey_frame_count: number | null
        hives: { identifier: string; apiary_id: string; apiaries: { name: string } }
        profiles: { display_name: string }
      }[]).map((row) => {
        const tags: ActivityTag[] = []

        if (row.queen_seen === 'vista') {
          tags.push({ type: 'queen_seen', label: 'regina vista' })
        }

        if (row.population === 'forte') {
          tags.push({ type: 'population', label: 'forte' })
        } else if (row.population === 'media') {
          tags.push({ type: 'population', label: 'media' })
        } else if (row.population === 'debole') {
          tags.push({ type: 'population', label: 'debole' })
        }

        if (row.honey_frame_count != null && row.honey_frame_count > 0) {
          tags.push({ type: 'melari', label: `+${row.honey_frame_count} melario` })
        }

        return {
          id: row.id,
          hiveId: row.hive_id,
          hiveIdentifier: row.hives.identifier,
          apiaryId: row.hives.apiary_id,
          apiaryName: row.hives.apiaries.name,
          inspectorId: row.performed_by,
          inspectorName: row.profiles.display_name,
          inspectedAt: row.performed_at,
          tags,
        }
      })
    },
    enabled: !!session?.user?.id,
  })
}
