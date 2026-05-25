import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { describeWeather } from '@/lib/weather/wmo'
import type { Tables } from '@/types/database'

type ApiaryRow = Tables<'apiaries'> & {
  hives: { id: string }[]
}

export type AccessLevel = 'owner' | 'editor' | 'reader'

export type WeatherInfo = {
  temp: number
  label: string
  code: number
}

export type ApiaryCard = {
  id: string
  name: string
  hiveCount: number
  lastInspectionAt: string | null
  hasActiveTreatment: boolean
  accessLevel: AccessLevel
  ownerDisplayName: string | null
  weather: WeatherInfo | null
  photoUrl: string | null
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'oggi'
  if (days === 1) return 'ieri'
  return `${days} g fa`
}

export type { ApiaryCard as ApiaryCardData }

export function useApiaryCards() {
  const { session } = useAuth()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['apiary-cards-v2'],
    queryFn: async (): Promise<ApiaryCard[]> => {
      const { data, error } = await supabase
        .from('apiaries')
        .select('id, name, owner_id, main_photo_path, latitude, longitude, hives(id), owner:owner_id(display_name)')
        .is('archived_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      const rows = data as unknown as (ApiaryRow & { owner_id: string; latitude: number | null; longitude: number | null; owner: { display_name: string } | null })[]
      if (!rows.length) return []

      const apiaryIds = rows.map((r) => r.id)
      const hiveIds = rows.flatMap((r) => r.hives.map((h) => h.id))

      // Latest inspection per hive (batch)
      const inspByApiary = new Map<string, string | null>()
      if (hiveIds.length > 0) {
        const { data: inspections } = await supabase
          .from('inspections')
          .select('hive_id, performed_at, hives!inner(apiary_id)')
          .in('hive_id', hiveIds)
          .order('performed_at', { ascending: false })

        if (inspections) {
          const seen = new Set<string>()
          for (const insp of inspections as unknown as {
            hive_id: string
            performed_at: string
            hives: { apiary_id: string }
          }[]) {
            const key = insp.hive_id
            if (!seen.has(key)) {
              seen.add(key)
              const existing = inspByApiary.get(insp.hives.apiary_id)
              if (!existing || insp.performed_at > existing) {
                inspByApiary.set(insp.hives.apiary_id, insp.performed_at)
              }
            }
          }
        }
      }

      // Active treatments per apiary
      const today = new Date().toISOString().slice(0, 10)
      const activeTxByApiary = new Set<string>()
      if (apiaryIds.length > 0) {
        const { data: treatments } = await supabase
          .from('treatments')
          .select('apiary_id')
          .in('apiary_id', apiaryIds)
          .eq('blocks_melari', true)
          .lte('start_date', today)
          .or(`end_date.is.null,end_date.gte.${today}`)

        if (treatments) {
          for (const t of treatments) {
            activeTxByApiary.add(t.apiary_id)
          }
        }
      }

      // User's access roles
      const accessRoles = new Map<string, AccessLevel>()
      if (userId) {
        const { data: access } = await supabase
          .from('apiary_access')
          .select('apiary_id, role')
          .eq('user_id', userId)

        if (access) {
          for (const a of access as { apiary_id: string; role: 'editor' | 'reader' }[]) {
            accessRoles.set(a.apiary_id, a.role)
          }
        }
      }

      // Weather — batch fetch for apiaries with coordinates
      type Coords = { id: string; lat: number; lng: number }
      const withCoords: Coords[] = []
      for (const r of rows) {
        if (r.latitude != null && r.longitude != null && r.latitude !== 0 && r.longitude !== 0) {
          withCoords.push({ id: r.id, lat: r.latitude, lng: r.longitude })
        }
      }

      const weatherByApiary = new Map<string, WeatherInfo>()
      if (withCoords.length > 0) {
        const lats = withCoords.map((c) => c.lat).join(',')
        const lngs = withCoords.map((c) => c.lng).join(',')
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,weather_code&forecast_days=1`,
          )
          if (res.ok) {
            const raw: unknown = await res.json()
            const json = (Array.isArray(raw) ? raw : [raw]) as { current?: { temperature_2m?: number; weather_code?: number } }[]
            for (let i = 0; i < Math.min(json.length, withCoords.length); i++) {
              const entry = json[i]
              const temp = entry?.current?.temperature_2m
              const code = entry?.current?.weather_code ?? 0
              if (temp != null) {
                weatherByApiary.set(withCoords[i]!.id, {
                  temp: Math.round(temp),
                  label: describeWeather(code).label_it,
                  code,
                })
              }
            }
          }
        } catch {
          // weather non disponibile — procedi senza
        }
      }

      // Photo URLs — batch sign
      const photoUrlByApiary = new Map<string, string>()
      const rowsWithPhoto = rows.filter(
        (r): r is typeof r & { main_photo_path: string } => r.main_photo_path != null,
      )
      if (rowsWithPhoto.length > 0) {
        const { data: signed } = await supabase.storage
          .from('apidiario-media')
          .createSignedUrls(
            rowsWithPhoto.map((r) => r.main_photo_path),
            3600,
          )
        for (const [i, row] of rowsWithPhoto.entries()) {
          const url = signed?.[i]?.signedUrl
          if (url) photoUrlByApiary.set(row.id, url)
        }
      }

      return rows.map((r) => {
        const accessLevel: AccessLevel = accessRoles.get(r.id) ?? 'owner'
        return {
          id: r.id,
          name: r.name,
          hiveCount: Array.isArray(r.hives) ? r.hives.length : 0,
          lastInspectionAt: inspByApiary.get(r.id) ?? null,
          hasActiveTreatment: activeTxByApiary.has(r.id),
          accessLevel,
          ownerDisplayName: r.owner?.display_name ?? null,
          weather: weatherByApiary.get(r.id) ?? null,
          photoUrl: photoUrlByApiary.get(r.id) ?? null,
        }
      })
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000,
  })
}

/** Helper to format an ISO date into "oggi" / "ieri" / "X g fa" */
export { formatRelativeDate }
