import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { predictBloom, type BloomPrediction } from '@/lib/phenology/predict'

// ── Species catalog ────────────────────────────────────────────

type PhenologySpecies = {
  id: string
  common_name_it: string
  scientific_name: string
  gdd_bloom_start: number
  gdd_bloom_peak: number
  gdd_bloom_end: number
  bloom_period_text: string | null
  honey_relevance: number
  produces_honey: boolean
  produces_pollen: boolean
  notes_it: string | null
}

export function usePhenologySpecies() {
  return useQuery({
    queryKey: ['phenology-species', 'v2'],
    queryFn: async (): Promise<PhenologySpecies[]> => {
      const { data, error } = await supabase
         
        .from('phenology_species')
        .select('*')
        .order('common_name_it')
      if (error) throw error
      return data as unknown as PhenologySpecies[]
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
}

// ── Weather fetch from Open-Meteo ──────────────────────────────

interface WeatherDay {
  date: string
  tmin: number
  tmax: number
}

const FORECAST_DAYS = 15

function buildWeatherUrl(lat: number, lng: number, startDate: string, endDate: string, elevation?: number) {
  const params = [
    `latitude=${lat}`,
    `longitude=${lng}`,
    `start_date=${startDate}`,
    `end_date=${endDate}`,
    'daily=temperature_2m_max,temperature_2m_min',
    'timezone=Europe/Rome',
  ]
  if (elevation != null) params.push(`elevation=${elevation}`)
  return `https://historical-forecast-api.open-meteo.com/v1/forecast?${params.join('&')}`
}

export function useWeatherData(lat: number | null, lng: number | null, year: number) {
  const currentYear = new Date().getFullYear()

  // For current year: extend end_date by FORECAST_DAYS to get predictions
  const endDate =
    year < currentYear
      ? `${year}-12-31`
      : (() => {
          const d = new Date()
          d.setDate(d.getDate() + FORECAST_DAYS)
          return d.toISOString().slice(0, 10)
        })()

  return useQuery({
    queryKey: ['weather', lat, lng, year, 'v2'],
    queryFn: async (): Promise<WeatherDay[]> => {
      if (lat == null || lng == null) return []

      let elevation: number | undefined
      try {
        const elRes = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
        )
        if (elRes.ok) {
          const elJson = (await elRes.json()) as { elevation?: number[] }
          const el = elJson.elevation
          if (el && el.length > 0) elevation = el[0]
        }
      } catch { /* elevation fetch fallito — si prosegue senza */ }

      const url = buildWeatherUrl(lat, lng, `${year}-01-01`, endDate, elevation)

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`)

      const json = await res.json()
      const times: string[] = json.daily?.time ?? []
      const tmaxArr: number[] = json.daily?.temperature_2m_max ?? []
      const tminArr: number[] = json.daily?.temperature_2m_min ?? []

      const days: WeatherDay[] = []
      for (let i = 0; i < times.length; i++) {
        days.push({ date: times[i]!, tmin: tminArr[i]!, tmax: tmaxArr[i]! })
      }
      return days
    },
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 60 * 6,
  })
}

// ── Combined: predictions for all species ───────────────────────

export function useBloomPredictions(
  weather: WeatherDay[] | undefined,
  species: PhenologySpecies[] | undefined,
  correctionFactors?: Record<string, number>,
): BloomPrediction[] {
  if (!weather || weather.length === 0 || !species) return []

  return species.map((s) =>
    predictBloom(weather, {
      id: s.id,
      common_name_it: s.common_name_it,
      gdd_bloom_start: s.gdd_bloom_start,
      gdd_bloom_peak: s.gdd_bloom_peak,
      gdd_bloom_end: s.gdd_bloom_end,
    }, undefined,
    { correctionFactor: correctionFactors?.[s.id] }),
  )
}
