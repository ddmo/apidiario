export type Season = 'primavera' | 'estate' | 'autunno' | 'inverno'

function northernSeason(month: number): Season {
  if (month >= 2 && month <= 4) return 'primavera'
  if (month >= 5 && month <= 7) return 'estate'
  if (month >= 8 && month <= 10) return 'autunno'
  return 'inverno'
}

export function getSeason(date: Date, lat?: number | null): Season {
  const m = date.getMonth()
  if (lat != null && lat < 0) {
    const shifted = (m + 6) % 12
    return northernSeason(shifted)
  }
  return northernSeason(m)
}
