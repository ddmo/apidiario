import { describe, it, expect } from 'vitest'
import { fetchWeather } from '@/lib/weather/snapshot'

describe('WeatherSnapshot', () => {
  it('fetchWeather returns a valid snapshot with summary', async () => {
    const snap = await fetchWeather(41.9, 12.5)

    expect(typeof snap.temperature).toBe('number')
    expect(typeof snap.weatherCode).toBe('number')
    expect(typeof snap.windSpeed).toBe('number')
    expect(typeof snap.humidity).toBe('number')
    expect(typeof snap.cloudCover).toBe('number')
    expect(typeof snap.precipitation).toBe('number')
    expect(typeof snap.summary).toBe('string')
    expect(snap.summary.length).toBeGreaterThan(0)
    expect(typeof snap.observedAt).toBe('string')
  })

  it('fetchWeather aborts on signal', async () => {
    const ctrl = new AbortController()
    ctrl.abort()

    await expect(fetchWeather(41.9, 12.5, ctrl.signal)).rejects.toThrow()
  })
})
