import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { predictBloom } from '@/lib/phenology/predict'
import type { Database } from '@/types/database'

type QueenSeen = Database['public']['Enums']['queen_seen_state']
type Population = Database['public']['Enums']['population_strength']
type Pathology = Database['public']['Enums']['pathology']
type Behavior = Database['public']['Enums']['behavior_type']
type VarroaMethod = Database['public']['Enums']['varroa_count_method']

export type ReportInspection = {
  id: string
  performedAt: string
  queenSeen: QueenSeen
  population: Population | null
  broodFrameCount: number | null
  honeyFrameCount: number | null
  pollenFrameCount: number | null
  emptyFrameCount: number | null
  pathologies: Pathology[]
  behavior: Behavior | null
  hasQueenCells: boolean
  varroaCount: number | null
  varroaCountMethod: VarroaMethod | null
  interventions: string[]
  pendingInterventions: string[]
  needsIntervention: boolean
}

export type ReportHive = {
  id: string
  identifier: string
  hiveType: Database['public']['Enums']['hive_type']
  beeRace: Database['public']['Enums']['bee_race']
  status: Database['public']['Enums']['hive_status']
  melariCount: number
  nidoFrameCount: number
  inspections: ReportInspection[]
}

export type ReportTreatment = {
  id: string
  productName: string
  startDate: string
  endDate: string | null
  costEur: number | null
  blocksMelari: boolean
}

export type ApiaryInfo = {
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  photoUrl: string | null
}

export type WeeklyWeather = {
  weekLabel: string // "DD/MM" of the first day in the week
  avgTmin: number
  avgTmax: number
  totalPrecip: number
  maxWind: number
}

export type BloomSpecies = {
  name: string
  honeyRelevance: number
  predictedStart: string | null
  predictedEnd: string | null
  observedStart: string | null
  observedEnd: string | null
}

export type ApiaryReportData = {
  apiaryName: string
  generatedAt: string
  seasonYear: number
  apiaryInfo: ApiaryInfo
  weeklyWeather: WeeklyWeather[]
  bloomSpecies: BloomSpecies[]
  hives: ReportHive[]
  treatments: ReportTreatment[]
}

function fmtShortIt(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
}

async function fetchSeasonWeather(lat: number, lon: number, year: number) {
  const today = new Date().toISOString().slice(0, 10)
  const endDate = year < new Date().getFullYear() ? `${year}-12-31` : today

  const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${year}-01-01&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Europe/Rome`

  const res = await fetch(url)
  if (!res.ok) return { daily: [] as { date: string; tmin: number; tmax: number }[], weekly: [] as WeeklyWeather[] }

  const json = await res.json()
  const times: string[] = json.daily?.time ?? []
  const tmaxArr: number[] = json.daily?.temperature_2m_max ?? []
  const tminArr: number[] = json.daily?.temperature_2m_min ?? []
  const precipArr: number[] = json.daily?.precipitation_sum ?? []
  const windArr: number[] = json.daily?.windspeed_10m_max ?? []

  const daily = times.map((date, i) => ({ date, tmin: tminArr[i] ?? 0, tmax: tmaxArr[i] ?? 0 }))

  type WeekBucket = { firstDate: string; tminSum: number; tmaxSum: number; count: number; precip: number; wind: number }
  const buckets = new Map<number, WeekBucket>()
  for (let i = 0; i < times.length; i++) {
    const week = Math.floor(i / 7)
    const b = buckets.get(week) ?? { firstDate: times[i]!, tminSum: 0, tmaxSum: 0, count: 0, precip: 0, wind: 0 }
    b.tminSum += tminArr[i] ?? 0
    b.tmaxSum += tmaxArr[i] ?? 0
    b.count += 1
    b.precip += precipArr[i] ?? 0
    b.wind = Math.max(b.wind, windArr[i] ?? 0)
    buckets.set(week, b)
  }

  const weekly: WeeklyWeather[] = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, b]) => ({
      weekLabel: fmtShortIt(b.firstDate),
      avgTmin: b.tminSum / b.count,
      avgTmax: b.tmaxSum / b.count,
      totalPrecip: b.precip,
      maxWind: b.wind,
    }))

  return { daily, weekly }
}

export function useApiaryReportData(apiaryId: string | null) {
  return useQuery({
    queryKey: ['apiaryReport', apiaryId],
    enabled: false,
    staleTime: 0,
    queryFn: async (): Promise<ApiaryReportData> => {
      if (!apiaryId) throw new Error('Nessun apiario selezionato')

      const { data: apiary, error: apiaryErr } = await supabase
        .from('apiaries')
        .select('name, address, latitude, longitude, main_photo_path')
        .eq('id', apiaryId)
        .single()
      if (apiaryErr) throw apiaryErr

      let photoUrl: string | null = null
      if (apiary.main_photo_path) {
        const { data: signed } = await supabase.storage
          .from('apidiario-media')
          .createSignedUrl(apiary.main_photo_path, 3600)
        photoUrl = signed?.signedUrl ?? null
      }

      const { data: hivesData, error: hivesErr } = await supabase
        .from('hives')
        .select('id, identifier, hive_type, bee_race, status, melari_count, nido_frame_count')
        .eq('apiary_id', apiaryId)
        .is('archived_at', null)
        .order('identifier', { ascending: true })
      if (hivesErr) throw hivesErr

      const hiveIds = (hivesData ?? []).map((h) => h.id)

      const inspByHive = new Map<string, ReportInspection[]>()
      if (hiveIds.length > 0) {
        const { data: inspectionsData, error: inspErr } = await supabase
          .from('inspections')
          .select(
            'id, hive_id, performed_at, queen_seen, population, brood_frame_count, honey_frame_count, pollen_frame_count, empty_frame_count, pathologies, behavior, has_queen_cells, varroa_count, varroa_count_method, interventions, pending_interventions, needs_intervention',
          )
          .in('hive_id', hiveIds)
          .order('performed_at', { ascending: true })
        if (inspErr) throw inspErr

        for (const insp of inspectionsData ?? []) {
          const list = inspByHive.get(insp.hive_id) ?? []
          list.push({
            id: insp.id,
            performedAt: insp.performed_at,
            queenSeen: insp.queen_seen,
            population: insp.population,
            broodFrameCount: insp.brood_frame_count,
            honeyFrameCount: insp.honey_frame_count,
            pollenFrameCount: insp.pollen_frame_count,
            emptyFrameCount: insp.empty_frame_count,
            pathologies: insp.pathologies ?? [],
            behavior: insp.behavior,
            hasQueenCells: insp.has_queen_cells,
            varroaCount: insp.varroa_count,
            varroaCountMethod: insp.varroa_count_method,
            interventions: insp.interventions ?? [],
            pendingInterventions: insp.pending_interventions ?? [],
            needsIntervention: insp.needs_intervention,
          })
          inspByHive.set(insp.hive_id, list)
        }
      }

      const hives: ReportHive[] = (hivesData ?? []).map((h) => ({
        id: h.id,
        identifier: h.identifier,
        hiveType: h.hive_type,
        beeRace: h.bee_race,
        status: h.status,
        melariCount: h.melari_count,
        nidoFrameCount: h.nido_frame_count,
        inspections: inspByHive.get(h.id) ?? [],
      }))

      const { data: treatmentsData, error: treatmentsErr } = await supabase
        .from('treatments')
        .select('id, product_name, start_date, end_date, cost_eur, blocks_melari')
        .eq('apiary_id', apiaryId)
        .order('start_date', { ascending: true })
      if (treatmentsErr) throw treatmentsErr

      const treatments: ReportTreatment[] = (treatmentsData ?? []).map((tr) => ({
        id: tr.id,
        productName: tr.product_name,
        startDate: tr.start_date,
        endDate: tr.end_date,
        costEur: tr.cost_eur,
        blocksMelari: tr.blocks_melari,
      }))

      const seasonYear = new Date().getFullYear()
      let weeklyWeather: WeeklyWeather[] = []
      let bloomSpecies: BloomSpecies[] = []

      // Specie associate a questo apiario: solo quelle per cui esiste già almeno
      // un'osservazione di fioritura reale (qualsiasi anno) — non l'elenco generico.
      const { data: apiarySpeciesLinks } = await supabase
        .from('bloom_observations')
        .select('species_id')
        .eq('apiary_id', apiaryId)
      const trackedSpeciesIds = [...new Set((apiarySpeciesLinks ?? []).map((r) => r.species_id))]

      if (apiary.latitude != null && apiary.longitude != null) {
        const { daily, weekly } = await fetchSeasonWeather(apiary.latitude, apiary.longitude, seasonYear)
        weeklyWeather = weekly

        if (daily.length > 0 && trackedSpeciesIds.length > 0) {
          const { data: speciesData } = await supabase
            .from('phenology_species')
            .select('id, common_name_it, gdd_bloom_start, gdd_bloom_peak, gdd_bloom_end, honey_relevance')
            .in('id', trackedSpeciesIds)
          const { data: observationsData } = await supabase
            .from('bloom_observations')
            .select('species_id, observed_start_date, observed_end_date')
            .eq('apiary_id', apiaryId)
            .eq('year', seasonYear)

          const observedMap = new Map((observationsData ?? []).map((o) => [o.species_id, o]))

          bloomSpecies = (speciesData ?? [])
            .map((s) => {
              const prediction = predictBloom(daily, s)
              const observed = observedMap.get(s.id)
              return {
                name: s.common_name_it,
                honeyRelevance: s.honey_relevance ?? 0,
                predictedStart: prediction.bloom_start?.date ?? null,
                predictedEnd: prediction.bloom_end?.date ?? null,
                observedStart: observed?.observed_start_date ?? null,
                observedEnd: observed?.observed_end_date ?? null,
              }
            })
            .sort((a, b) => (a.predictedStart ?? a.observedStart ?? '').localeCompare(b.predictedStart ?? b.observedStart ?? ''))
        }
      }

      return {
        apiaryName: apiary.name,
        generatedAt: new Date().toISOString(),
        seasonYear,
        apiaryInfo: {
          name: apiary.name,
          address: apiary.address,
          latitude: apiary.latitude,
          longitude: apiary.longitude,
          photoUrl,
        },
        weeklyWeather,
        bloomSpecies,
        hives,
        treatments,
      }
    },
  })
}
