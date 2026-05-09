import type { Rule } from '../types'

export const queenNotSeen: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (insp.queen_seen !== 'non_vista') return null
  return {
    id: 'queen-not-seen',
    severity: 'warning',
    category: 'queen',
    title: 'Regina non vista',
    description: "Regina non avvistata nell'ultima ispezione. Cerca la regina alla prossima visita.",
    reason: "queen_seen === 'non_vista' nell'ultima ispezione",
  }
}

export const suspectedOrphan: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (insp.queen_seen === 'vista') return null
  if (insp.brood_eggs !== false) return null
  return {
    id: 'suspected-orphan',
    severity: 'critical',
    category: 'queen',
    title: 'Sospetto orfanaggio',
    description: "Regina non vista e nessuna covata fresca (uova). Verifica urgente dell'orfanaggio.",
    reason: "queen_seen !== 'vista' AND brood_eggs === false",
    dueByDays: 3,
  }
}

export const queenFailing: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (insp.brood_eggs !== false) return null
  if (insp.brood_larvae !== false) return null
  if (insp.brood_capped !== true) return null
  return {
    id: 'queen-failing',
    severity: 'warning',
    category: 'brood',
    title: 'Possibile fallimento regina',
    description: 'Covata opercolata presente ma niente uova o larve fresche. La regina potrebbe essere fallita o assente.',
    reason: 'brood_eggs === false AND brood_larvae === false AND brood_capped === true',
    dueByDays: 7,
  }
}

export const queenConfirmedByEggs: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (insp.queen_seen !== 'non_vista') return null
  if (insp.brood_eggs !== true) return null
  return {
    id: 'queen-confirmed-by-eggs',
    severity: 'info',
    category: 'queen',
    title: 'Regina presente (uova fresche)',
    description: 'La regina non è stata vista ma ci sono uova fresche: è attiva e ovificante.',
    reason: "queen_seen === 'non_vista' AND brood_eggs === true",
  }
}
