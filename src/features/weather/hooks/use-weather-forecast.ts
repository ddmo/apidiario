import { useQuery } from '@tanstack/react-query'
import { describeWeather, type WeatherDescriptor } from '@/lib/weather/wmo'
import { assessForBeekeeping, type BeekeepingDayAssessment } from '@/lib/weather/beekeeping'

export interface ForecastDay {
  date: string
  weather: WeatherDescriptor
  tmin: number
  tmax: number
  precip_sum: number
  precip_prob: number
  wind_max: number
  beekeeping: BeekeepingDayAssessment
}

export interface CurrentWeather {
  temperature: number
  weather: WeatherDescriptor
}

export interface WeatherForecast {
  current: CurrentWeather
  days: ForecastDay[]
  elevation: number | null
  fetchedAt: number
}

function buildForecastUrl(lat: number, lng: number, elevation?: number) {
  const params = [
    `latitude=${lat}`,
    `longitude=${lng}`,
    `forecast_days=16`,
    'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    'current=temperature_2m,weather_code',
    'timezone=Europe/Rome',
  ]
  if (elevation != null) params.push(`elevation=${elevation}`)
  return `https://api.open-meteo.com/v1/forecast?${params.join('&')}`
}

export function useWeatherForecast(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['weather-forecast', lat, lng],
    queryFn: async (): Promise<WeatherForecast> => {
      if (lat == null || lng == null) throw new Error('Coordinate mancanti')

      // Fetch elevation
      let elevation: number | undefined
      try {
        const elRes = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
        )
        if (elRes.ok) {
          const elJson = (await elRes.json()) as { elevation?: number[] }
          const el = elJson.elevation
          if (el && el.length > 0) elevation = Math.round(el[0]!)
        }
      } catch { /* prosegui senza */ }

      const url = buildForecastUrl(lat, lng, elevation)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`)

      const json = await res.json()

      const currentCode: number = json.current?.weather_code ?? 0
      const currentTemp: number = json.current?.temperature_2m ?? 0

      const times: string[] = json.daily?.time ?? []
      const codes: number[] = json.daily?.weather_code ?? []
      const tmaxArr: number[] = json.daily?.temperature_2m_max ?? []
      const tminArr: number[] = json.daily?.temperature_2m_min ?? []
      const precipSum: number[] = json.daily?.precipitation_sum ?? []
      const precipProb: number[] = json.daily?.precipitation_probability_max ?? []
      const windMax: number[] = json.daily?.wind_speed_10m_max ?? []

      const days: ForecastDay[] = []
      for (let i = 0; i < times.length; i++) {
        const tmax = tmaxArr[i]!
        const tmin = tminArr[i]!
        const wcode = codes[i]!
        const pProb = precipProb[i]!
        const wMax = windMax[i]!

        days.push({
          date: times[i]!,
          weather: describeWeather(wcode),
          tmin,
          tmax,
          precip_sum: precipSum[i]!,
          precip_prob: pProb,
          wind_max: wMax,
          beekeeping: assessForBeekeeping({
            tmax,
            tmin,
            weather_code: wcode,
            precip_prob: pProb,
            wind_max: wMax,
          }),
        })
      }

      return {
        current: {
          temperature: currentTemp,
          weather: describeWeather(currentCode),
        },
        days,
        elevation: elevation ?? null,
        fetchedAt: Date.now(),
      }
    },
    enabled: lat != null && lng != null,
    staleTime: 0,
  })
}
