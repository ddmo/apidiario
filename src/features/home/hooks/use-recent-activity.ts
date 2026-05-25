import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export type ActivityTag =
  | { type: 'queen_seen'; label: string }
  | { type: 'population'; label: string }
  | { type: 'melari'; label: string }

export type ActivityItem = {
  id: string
  type: 'inspection' | 'treatment'
  hiveId?: string
  hiveIdentifier?: string
  apiaryId: string
  apiaryName: string
  inspectorId: string
  inspectorName: string
  inspectedAt: string
  tags: ActivityTag[]
  productName?: string
}

export function useRecentActivityByOthers() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['recent-activity', 'v2'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 14)
      const cutoffStr = cutoff.toISOString()

      // Inspections by others (last 14 days)
      const { data: inspections } = await supabase
        .from('inspections')
        .select(`
          id, hive_id, performed_at, performed_by,
          queen_seen, population, honey_frame_count,
          hives!inner(identifier, apiary_id, apiaries!inner(name)),
          profiles(display_name)
        `)
        .gte('performed_at', cutoffStr)
        .neq('performed_by', session?.user?.id ?? '')
        .order('performed_at', { ascending: false })
        .limit(20)

      const items: ActivityItem[] = (inspections ?? []).map((row: any) => {
        const tags: ActivityTag[] = []
        if (row.queen_seen === 'vista') tags.push({ type: 'queen_seen', label: 'regina vista' })
        if (row.population === 'forte') tags.push({ type: 'population', label: 'forte' })
        else if (row.population === 'media') tags.push({ type: 'population', label: 'media' })
        else if (row.population === 'debole') tags.push({ type: 'population', label: 'debole' })
        if (row.honey_frame_count != null && row.honey_frame_count > 0) {
          tags.push({ type: 'melari', label: `+${row.honey_frame_count} melario` })
        }
        return {
          id: row.id,
          type: 'inspection' as const,
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

      // Treatments by others (last 14 days)
      const { data: treatments } = await supabase
        .from('treatments')
        .select('id, product_name, apiary_id, created_at, performed_by, apiaries!inner(name), performer:performed_by(display_name)')
        .gte('created_at', cutoffStr)
        .neq('performed_by', session?.user?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(20)

      for (const t of treatments ?? []) {
        const row = t as any
        items.push({
          id: 'treatment-' + row.id,
          type: 'treatment',
          apiaryId: row.apiary_id,
          apiaryName: row.apiaries.name,
          inspectorId: row.performed_by,
          inspectorName: row.performer?.display_name ?? '',
          inspectedAt: row.created_at,
          tags: [],
          productName: row.product_name,
        })
      }

      // Merge & sort by date descending
      items.sort((a, b) => new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime())

      return items
    },
    enabled: !!session?.user?.id,
  })
}
