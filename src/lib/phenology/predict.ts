interface Species {
  id: string
  common_name_it: string
  gdd_bloom_start: number
  gdd_bloom_peak: number
  gdd_bloom_end: number
}

interface DailyWeather {
  date: string
  tmin: number
  tmax: number
}

export interface BloomPrediction {
  species_id: string
  bloom_start: { date: string; gdd: number } | null
  bloom_peak: { date: string; gdd: number } | null
  bloom_end: { date: string; gdd: number } | null
  current_phase: 'pre' | 'start' | 'peak' | 'post'
  current_gdd: number
}

const T_BASE = 5.0
const T_CAP = 30.0

function dailyGdd(tmin: number, tmax: number): number {
  const tmaxC = Math.min(tmax, T_CAP)
  const tminC = Math.min(tmin, T_CAP)
  return Math.max(0, (tminC + tmaxC) / 2 - T_BASE)
}

export function predictBloom(
  weather: DailyWeather[],
  species: Species,
  today: string = new Date().toISOString().slice(0, 10),
): BloomPrediction {
  let cumulative = 0
  let currentGdd = 0

  const result: BloomPrediction = {
    species_id: species.id,
    bloom_start: null,
    bloom_peak: null,
    bloom_end: null,
    current_phase: 'pre',
    current_gdd: 0,
  }

  for (const day of weather) {
    cumulative += dailyGdd(day.tmin, day.tmax)

    if (day.date <= today) {
      currentGdd = cumulative
    }

    if (!result.bloom_start && cumulative >= species.gdd_bloom_start) {
      result.bloom_start = { date: day.date, gdd: Math.round(cumulative) }
    }
    if (!result.bloom_peak && cumulative >= species.gdd_bloom_peak) {
      result.bloom_peak = { date: day.date, gdd: Math.round(cumulative) }
    }
    if (!result.bloom_end && cumulative >= species.gdd_bloom_end) {
      result.bloom_end = { date: day.date, gdd: Math.round(cumulative) }
    }
  }

  result.current_gdd = Math.round(currentGdd)

  if (currentGdd < species.gdd_bloom_start) result.current_phase = 'pre'
  else if (currentGdd < species.gdd_bloom_peak) result.current_phase = 'start'
  else if (currentGdd < species.gdd_bloom_end) result.current_phase = 'peak'
  else result.current_phase = 'post'

  return result
}
