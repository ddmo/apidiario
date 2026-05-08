import { describeWeather } from './wmo'

export interface BeekeepingDayAssessment {
  inspection_score: 0 | 1 | 2 | 3
  reasons: string[]
}

export function assessForBeekeeping(day: {
  tmax: number
  tmin: number
  weather_code: number
  precip_prob: number
  wind_max: number
}): BeekeepingDayAssessment {
  const reasons: string[] = []
  let score = 3

  if (day.tmax < 15) { score = 0; reasons.push('Troppo freddo per aprire') }
  else if (day.tmax < 18) { score = Math.min(score, 1); reasons.push('Temperatura bassa') }

  if (day.precip_prob >= 60) { score = 0; reasons.push('Pioggia probabile') }
  else if (day.precip_prob >= 30) { score = Math.min(score, 1); reasons.push('Pioggia possibile') }

  if (day.wind_max > 30) { score = Math.min(score, 1); reasons.push('Vento forte') }
  else if (day.wind_max > 20) { score = Math.min(score, 2); reasons.push('Vento moderato') }

  const cat = describeWeather(day.weather_code).category
  if (cat === 'thunderstorm') { score = 0; reasons.push('Temporali in arrivo') }

  if (score === 3 && reasons.length === 0) reasons.push('Condizioni ideali')

  return { inspection_score: score as 0 | 1 | 2 | 3, reasons }
}
