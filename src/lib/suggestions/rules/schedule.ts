import type { Rule } from '../types'
import type { Reminder } from '../types'

export const remindersDue: Rule = (ctx) => {
  if (!ctx.reminders?.length) return null

  // Find reminders relevant to this hive
  const relevant = ctx.reminders.filter((r: Reminder) => {
    if (r.scope === 'global') return true
    if (r.scope === 'apiary') return r.apiary_id === ctx.hive.apiary_id
    if (r.scope === 'hive') return r.hive_id === ctx.hive.id
    return false
  })

  if (!relevant.length) return null

  // Nearest reminder (relevant is non-empty, so [0] is safe)
  const nearest = relevant.sort(
    (a: Reminder, b: Reminder) =>
      new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
  )[0]!

  const daysUntilDue = Math.ceil(
    (new Date(nearest.due_at).getTime() - ctx.today.getTime()) / 86_400_000,
  )

  const isOverdue = daysUntilDue <= 0
  const label = nearest.recurrence !== 'none'
    ? nearest.recurrence === 'weekly' ? ' (settimanale)' : nearest.recurrence === 'monthly' ? ' (mensile)' : ' (annuale)'
    : ''

  return {
    id: `reminder-${nearest.id}`,
    severity: isOverdue ? 'warning' : 'info',
    category: 'schedule',
    title: isOverdue ? 'Promemoria in ritardo' : 'Promemoria in scadenza',
    description: `${nearest.title}${label} — ${isOverdue ? 'Scaduto il' : 'Entro il'} ${new Date(nearest.due_at).toLocaleDateString('it-IT')}`,
    reason: `reminder "${nearest.title}" due on ${nearest.due_at}`,
    dueByDays: isOverdue ? 0 : daysUntilDue,
  }
}

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
