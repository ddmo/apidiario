import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type ActivityRow = Pick<Tables<'activity_log'>, 'user_id' | 'action' | 'entity_type' | 'created_at'> & {
  profiles: { display_name: string } | { display_name: string }[]
}

export type DailyUsagePoint = { date: string; label: string; count: number }
export type BreakdownEntry = { key: string; count: number }
export type UserUsageEntry = { userId: string; displayName: string; count: number }

export type AppUsage = {
  totalEvents: number
  activeUserCount: number
  avgPerDay: number
  daily: DailyUsagePoint[]
  byEntityType: BreakdownEntry[]
  byAction: BreakdownEntry[]
  byUser: UserUsageEntry[]
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export function useAppUsage(days: number, userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'app-usage', days, userId],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<AppUsage> => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - (days - 1))
      cutoff.setHours(0, 0, 0, 0)

      let query = supabase
        .from('activity_log')
        .select('user_id, action, entity_type, created_at, profiles!inner(display_name)')
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: true })
        .limit(20_000)

      if (userId) query = query.eq('user_id', userId)

      const { data, error } = await query
      if (error) throw error
      const rows = data as unknown as ActivityRow[]

      // daily buckets, pre-filled with zeros so the chart has no gaps
      const dailyMap = new Map<string, number>()
      for (let i = 0; i < days; i++) {
        const d = new Date(cutoff)
        d.setDate(cutoff.getDate() + i)
        dailyMap.set(dayKey(d.toISOString()), 0)
      }

      const entityMap = new Map<string, number>()
      const actionMap = new Map<string, number>()
      const userMap = new Map<string, UserUsageEntry>()

      for (const row of rows) {
        const key = dayKey(row.created_at)
        if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1)

        entityMap.set(row.entity_type, (entityMap.get(row.entity_type) ?? 0) + 1)
        actionMap.set(row.action, (actionMap.get(row.action) ?? 0) + 1)

        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        const existing = userMap.get(row.user_id)
        if (existing) existing.count += 1
        else userMap.set(row.user_id, { userId: row.user_id, displayName: profile?.display_name ?? '—', count: 1 })
      }

      const daily: DailyUsagePoint[] = Array.from(dailyMap.entries()).map(([date, count]) => ({
        date,
        label: new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        count,
      }))

      return {
        totalEvents: rows.length,
        activeUserCount: userMap.size,
        avgPerDay: rows.length / days,
        daily,
        byEntityType: Array.from(entityMap.entries())
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count),
        byAction: Array.from(actionMap.entries())
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count),
        byUser: Array.from(userMap.values()).sort((a, b) => b.count - a.count),
      }
    },
  })
}
