import { useQuery } from '@tanstack/react-query'
import { describeWeather } from './wmo'

export interface WeatherSnapshot {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
  cloudCover: number
  precipitation: number
  summary: string
  observedAt: string
}

function buildSummary(snap: Omit<WeatherSnapshot, 'summary' | 'observedAt'>): string {
  const desc = describeWeather(snap.weatherCode)
  const parts: string[] = [desc.label_it.toLowerCase()]
  parts.push(`umidità ${snap.humidity}%`)
  if (snap.windSpeed > 0) parts.push(`vento ${snap.windSpeed} km/h`)
  if (snap.cloudCover > 0) parts.push(`nuvole ${snap.cloudCover}%`)
  if (snap.precipitation > 0) parts.push(`precipitazioni ${snap.precipitation} mm`)
  return parts.join(', ')
}

export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,cloud_cover,precipitation',
    timezone: 'auto',
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`)
  const json = await res.json()
  const c = json.current ?? {}
  const snapshot: Omit<WeatherSnapshot, 'summary'> = {
    temperature: c.temperature_2m ?? 0,
    weatherCode: c.weather_code ?? 0,
    windSpeed: c.wind_speed_10m ?? 0,
    humidity: c.relative_humidity_2m ?? 0,
    cloudCover: c.cloud_cover ?? 0,
    precipitation: c.precipitation ?? 0,
    observedAt: new Date().toISOString(),
  }
  return { ...snapshot, summary: buildSummary(snapshot) }
}

export function useWeatherSnapshot(lat?: number | null, lng?: number | null) {
  return useQuery({
    queryKey: ['weather-snapshot', lat, lng],
    queryFn: ({ signal }) => {
      if (lat == null || lng == null) throw new Error('Coordinate mancanti')
      return fetchWeather(lat, lng, signal)
    },
    enabled: lat != null && lng != null,
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
  })
}
