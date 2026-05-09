import type { Rule } from '../types'

export const overdueInspectionActiveSeason: Rule = (ctx) => {
  if (ctx.daysSinceLastInspection == null) return null
  if (ctx.daysSinceLastInspection <= 14) return null
  const m = ctx.today.getMonth()
  if (m < 2 || m > 8) return null
  return {
    id: 'overdue-inspection-active-season',
    severity: 'warning',
    category: 'schedule',
    title: 'Ispezione in ritardo',
    description: `Ultima ispezione ${ctx.daysSinceLastInspection} giorni fa. In stagione attiva si consiglia un'ispezione ogni 14 giorni.`,
    reason: `daysSinceLastInspection = ${ctx.daysSinceLastInspection} (>14) nel periodo marzo-settembre`,
    dueByDays: 7,
  }
}

export const firstInspectionNeeded: Rule = (ctx) => {
  if (ctx.lastInspection !== null) return null
  if (!ctx.hive.installed_on) return null
  return {
    id: 'first-inspection-needed',
    severity: 'info',
    category: 'schedule',
    title: 'Prima ispezione consigliata',
    description: 'Questa arnia non è mai stata ispezionata. Pianifica la prima ispezione per valutare lo stato della famiglia.',
    reason: 'lastInspection è null AND installed_on esiste',
    dueByDays: 7,
  }
}
