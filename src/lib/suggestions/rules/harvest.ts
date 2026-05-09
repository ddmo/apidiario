import type { Rule } from '../types'

export const melariCheck: Rule = (ctx) => {
  if (ctx.hive.melari_count <= 0) return null
  return {
    id: 'melari-check',
    severity: 'warning',
    category: 'harvest',
    title: 'Controllo melari',
    description: `L'arnia ha ${ctx.hive.melari_count} melari installati. Verifica lo stato dei melari, valuta smielatura e rotazione dei favi.`,
    reason: `melari_count = ${ctx.hive.melari_count} (>0)`,
    dueByDays: 7,
  }
}
