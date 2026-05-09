import type { Rule } from '../types'

export const weakPopulation: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (insp.population !== 'debole') return null
  return {
    id: 'weak-population',
    severity: 'warning',
    category: 'population',
    title: 'Popolazione debole',
    description: 'La popolazione rilevata è debole. Valuta nutrizione di sostegno o, se la famiglia è troppo piccola, unione con altra famiglia.',
    reason: `population = ${insp.population}`,
    dueByDays: 7,
  }
}

export const lowHoneyStoresPreWinter: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  const m = ctx.today.getMonth()
  if (m < 8 || m > 10) return null
  if (insp.honey_frame_count == null) return null
  if (insp.honey_frame_count > 2) return null
  return {
    id: 'low-honey-stores-pre-winter',
    severity: 'warning',
    category: 'stores',
    title: 'Scorte invernali insufficienti',
    description: `Solo ${insp.honey_frame_count} telaini di miele a inizio autunno. Integra con alimentazione zuccherina per garantire scorte invernali sufficienti.`,
    reason: `honey_frame_count = ${insp.honey_frame_count} (≤2) nel periodo settembre-novembre`,
    dueByDays: 14,
  }
}

export const lowPollenSpring: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  const m = ctx.today.getMonth()
  if (m < 1 || m > 3) return null
  if (insp.pollen_frame_count == null) return null
  if (insp.pollen_frame_count > 1) return null
  return {
    id: 'low-pollen-spring',
    severity: 'info',
    category: 'stores',
    title: 'Poco polline in primavera',
    description: `Solo ${insp.pollen_frame_count} telaini di polline. In primavera il polline è essenziale per la covata: valuta candito proteico.`,
    reason: `pollen_frame_count = ${insp.pollen_frame_count} (≤1) nel periodo febbraio-aprile`,
  }
}
