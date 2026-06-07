import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { predictBloom } from '@/lib/phenology/predict'

export type AlertSeverity = 'critical' | 'warning'

export type HomeAlert =
  | { type: 'active_treatment'; id: string; message: string; apiaryId: string; productName: string; severity: AlertSeverity }
  | { type: 'bad_weather'; id: string; message: string; apiaryId: string; apiaryName: string; severity: AlertSeverity }
  | { type: 'overdue_inspection'; id: string; message: string; apiaryId: string; hiveId: string; hiveName: string; days: number; severity: AlertSeverity }
  | { type: 'active_bloom'; id: string; message: string; apiaryId: string; apiaryName: string; speciesName: string; phase: 'start' | 'peak'; severity: AlertSeverity }

type AlertUnion = HomeAlert

export function useTodaysAlerts() {
  const { session } = useAuth()

  // 1. Active treatments with blocks_melari
  const activeTreatments = useQuery({
    queryKey: ['home-alerts', 'active-treatments'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('treatments')
        .select('id, product_name, end_date, apiary_id, apiaries!inner(name)')
        .eq('blocks_melari', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)

      if (error) throw error

      return (data as unknown as {
        id: string
        product_name: string
        end_date: string | null
        apiary_id: string
        apiaries: { name: string }
      }[]).map((t) => {
        const msg = t.end_date
          ? `Trattamento "${t.product_name}" attivo in ${t.apiaries.name} — blocca melari fino al ${new Date(t.end_date).toLocaleDateString('it-IT')}`
          : `Trattamento "${t.product_name}" attivo in ${t.apiaries.name} — blocca melari`
        return {
          type: 'active_treatment' as const,
          id: 'treatment-' + t.apiary_id + '-' + t.product_name.replace(/\s+/g, '_'),
          message: msg,
          apiaryId: t.apiary_id,
          productName: t.product_name,
          severity: 'warning' as AlertSeverity,
        }
      }) as AlertUnion[]
    },
    enabled: !!session?.user?.id,
  })

  // 2. Overdue inspections (> 35 days since last inspection)
  const overdueInspections = useQuery({
    queryKey: ['home-alerts', 'overdue'],
    queryFn: async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 35)
      const cutoffStr = cutoff.toISOString()

      // Get all hives the user can see with their latest inspection
      const { data, error } = await supabase
        .from('hives')
        .select('id, identifier, apiary_id, apiaries!inner(name)')
        .is('archived_at', null)

      if (error) throw error
      if (!data.length) return []

      const hiveIds = data.map((h) => h.id)

      // Latest inspection per hive
      const { data: inspections } = await supabase
        .from('inspections')
        .select('hive_id, performed_at')
        .in('hive_id', hiveIds)
        .order('performed_at', { ascending: false })

      const lastInspMap = new Map<string, string>()
      if (inspections) {
        for (const insp of inspections) {
          if (!lastInspMap.has(insp.hive_id)) {
            lastInspMap.set(insp.hive_id, insp.performed_at)
          }
        }
      }

      const alerts: AlertUnion[] = []
      for (const hive of data as unknown as {
        id: string
        identifier: string
        apiary_id: string
        apiaries: { name: string }
      }[]) {
        const lastInsp = lastInspMap.get(hive.id)
        if (!lastInsp || lastInsp < cutoffStr) {
          const days = lastInsp
            ? Math.floor((Date.now() - new Date(lastInsp).getTime()) / 86_400_000)
            : 999
          alerts.push({
            type: 'overdue_inspection' as const,
            id: 'overdue-' + hive.id,
            message: lastInsp
              ? `Arnia ${hive.identifier} in ${hive.apiaries.name} non ispezionata da ${days} giorni`
              : `Arnia ${hive.identifier} in ${hive.apiaries.name} mai ispezionata`,
            apiaryId: hive.apiary_id,
            hiveId: hive.id,
            hiveName: hive.identifier,
            days,
            severity: days > 60 ? 'critical' as AlertSeverity : 'warning' as AlertSeverity,
          })
        }
      }

      return alerts
    },
    enabled: !!session?.user?.id,
  })

  // 3. Bad weather — first apiary with coordinates
  const badWeather = useQuery({
    queryKey: ['home-alerts', 'weather'],
    queryFn: async () => {
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id, name, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .is('archived_at', null)

      if (!apiaries?.length) return []

      const results = await Promise.all(
        apiaries
          .filter((a) => a.latitude && a.longitude)
          .map(async (apiary) => {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${apiary.latitude}&longitude=${apiary.longitude}&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&timezone=Europe/Rome&forecast_days=2`
            try {
              const res = await fetch(url)
              if (!res.ok) return []
              const json = await res.json()
              const items: AlertUnion[] = []
              for (let i = 0; i < Math.min(2, (json.daily?.time ?? []).length); i++) {
                const precip = json.daily?.precipitation_sum?.[i] ?? 0
                const wind = json.daily?.wind_speed_10m_max?.[i] ?? 0
                const date = json.daily?.time?.[i] ?? ''
                const label = i === 0 ? 'Oggi' : 'Domani'
                if (precip > 5 || wind > 40) {
                  const parts: string[] = [label]
                  if (precip > 5) parts.push(`${precip}mm pioggia`)
                  if (wind > 40) parts.push(`vento ${wind}km/h`)
                  items.push({
                    type: 'bad_weather',
                    id: 'weather-' + apiary.id + '-' + date,
                    message: `Meteo avverso in ${apiary.name}: ${parts.join(', ')}`,
                    apiaryId: apiary.id,
                    apiaryName: apiary.name,
                    severity: 'warning',
                  })
                }
              }
              return items
            } catch {
              return []
            }
          }),
      )

      return results.flat()
    },
    enabled: !!session?.user?.id,
    staleTime: 30 * 60 * 1000, // weather data stale after 30 min
  })

  // 4. Bloom predictions — species at start/peak phase per apiary
  const bloomAlerts = useQuery({
    queryKey: ['home-alerts', 'bloom-v3', new Date().getFullYear()],
    queryFn: async (): Promise<AlertUnion[]> => {
      const year = new Date().getFullYear()
      const today = new Date().toISOString().slice(0, 10)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 15)
      const endDateStr = endDate.toISOString().slice(0, 10)

      // Apiaries with coords
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id, name, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .is('archived_at', null)

      if (!apiaries?.length) return []

      const withCoords = apiaries.filter(
        (a): a is typeof a & { latitude: number; longitude: number } =>
          a.latitude != null && a.longitude != null && a.latitude !== 0 && a.longitude !== 0,
      )
      if (!withCoords.length) return []

      // Species catalog
      const { data: species } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('phenology_species')
        .select('id, common_name_it, gdd_bloom_start, gdd_bloom_peak, gdd_bloom_end, honey_relevance')

      if (!species?.length) return []
      const typedSpecies = species as unknown as {
        id: string
        common_name_it: string
        gdd_bloom_start: number
        gdd_bloom_peak: number
        gdd_bloom_end: number
        honey_relevance: number
      }[]

      // Species per apiary — filter alerts to only configured species
      const { data: apiarySpecies } = await supabase
        .from('apiary_species')
        .select('apiary_id, species_id')
        .in('apiary_id', withCoords.map((a) => a.id))
      const speciesByApiary = new Map<string, Set<string>>()
      for (const row of apiarySpecies ?? []) {
        const set = speciesByApiary.get(row.apiary_id) ?? new Set()
        set.add(row.species_id)
        speciesByApiary.set(row.apiary_id, set)
      }

      // Batch weather fetch from Open-Meteo historical-forecast API (single endpoint)
      const lats = withCoords.map((a) => a.latitude).join(',')
      const lngs = withCoords.map((a) => a.longitude).join(',')
      const weatherUrl =
        `https://historical-forecast-api.open-meteo.com/v1/forecast?` +
        `latitude=${lats}&longitude=${lngs}&` +
        `start_date=${year}-01-01&end_date=${endDateStr}&` +
        `daily=temperature_2m_max,temperature_2m_min&timezone=Europe/Rome`

      const res = await fetch(weatherUrl)
      if (!res.ok) return []

      const weatherJson = await res.json()
      // Multi-location returns array, single location returns object
      const weatherArr = Array.isArray(weatherJson) ? weatherJson : [weatherJson]

      const result: AlertUnion[] = []
      for (let i = 0; i < Math.min(weatherArr.length, withCoords.length); i++) {
        const apiary = withCoords[i]!
        const allowedSpecies = speciesByApiary.get(apiary.id)
        const entry = weatherArr[i]
        const times: string[] = entry?.daily?.time ?? []
        const tmaxArr: number[] = entry?.daily?.temperature_2m_max ?? []
        const tminArr: number[] = entry?.daily?.temperature_2m_min ?? []
        if (!times.length) continue

        const weather = times.map((date: string, idx: number) => ({
          date,
          tmin: tminArr[idx] ?? 0,
          tmax: tmaxArr[idx] ?? 0,
        }))

        for (const s of typedSpecies) {
          // Only alert for species the user has configured on this apiary
          if (!allowedSpecies || !allowedSpecies.has(s.id)) continue

          const prediction = predictBloom(weather, s, today)

          // Already ongoing bloom (start or peak phase)
          if (prediction.current_phase === 'start' || prediction.current_phase === 'peak') {
            const phaseLabel = prediction.current_phase === 'peak' ? 'piena fioritura' : 'inizio fioritura'
            const daysSince = prediction.bloom_start?.date
              ? Math.ceil(
                  (Date.now() - new Date(prediction.bloom_start.date).getTime()) / 86_400_000,
                )
              : 0
            result.push({
              type: 'active_bloom',
              id: `bloom-${apiary.id}-${s.id}-${year}`,
              message: `${s.common_name_it} — ${phaseLabel} a ${apiary.name}${daysSince > 0 ? ` (da ${daysSince} ${daysSince === 1 ? 'giorno' : 'giorni'})` : ''}`,
              apiaryId: apiary.id,
              apiaryName: apiary.name,
              speciesName: s.common_name_it,
              phase: prediction.current_phase,
              severity: 'warning',
            })
          }

          // Future bloom starting within 15 days
          if (prediction.bloom_start?.date) {
            const daysUntil = Math.ceil(
              (new Date(prediction.bloom_start.date).getTime() - Date.now()) / 86_400_000,
            )
            if (prediction.current_phase !== 'start' && prediction.current_phase !== 'peak' && daysUntil >= 0 && daysUntil <= 15) {
              result.push({
                type: 'active_bloom',
                id: `bloom-${apiary.id}-${s.id}-${year}-future`,
                message: `${s.common_name_it} — ${daysUntil} ${daysUntil === 1 ? 'giorno' : 'giorni'} all'inizio fioritura a ${apiary.name}`,
                apiaryId: apiary.id,
                apiaryName: apiary.name,
                speciesName: s.common_name_it,
                phase: 'start',
                severity: 'warning',
              })
            }
          }
        }
      }

      return result
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 60 * 12,
  })

  const isLoading = activeTreatments.isLoading || overdueInspections.isLoading || badWeather.isLoading || bloomAlerts.isLoading
  const isError = activeTreatments.isError || overdueInspections.isError || badWeather.isError || bloomAlerts.isError

  const alerts: AlertUnion[] = [
    ...(activeTreatments.data ?? []),
    ...(overdueInspections.data ?? []),
    ...(badWeather.data ?? []),
    ...(bloomAlerts.data ?? []),
  ]

  // Show critical first, then warning
  alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1 }
    return order[a.severity] - order[b.severity]
  })

  return { alerts, isLoading, isError }
}
