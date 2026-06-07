import type { Rule, Inspection } from '../types'
import { getSeason } from '../seasons'

export const swarmingRoyalCellsFollowup: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (!insp.has_queen_cells) return null
  if ((ctx.daysSinceLastInspection ?? 0) < 5) return null
  const removed = (insp.queen_cells_removed as string[] | null) ?? []
  const remaining = (insp.queen_cells_remaining as string[] | null) ?? []
  const allTypes = [...removed, ...remaining]
  if (allTypes.length === 0) return null
  const parts: string[] = []
  if (removed.length > 0) parts.push(`tolte: ${removed.join(', ')}`)
  if (remaining.length > 0) parts.push(`lasciate: ${remaining.join(', ')}`)
  return {
    id: 'royal-cells-followup',
    severity: 'critical',
    category: 'swarming',
    title: 'Celle reali — ricontrollo urgente',
    description: `Celle reali (${parts.join('; ')}) rilevate nell'ultima ispezione. Ricontrolla entro 7 giorni dalla visita precedente.`,
    reason: `has_queen_cells = true AND giorni dall'ispezione >= 5`,
    dueByDays: 7,
  }
}

/** Count how many of last N inspections have non-empty queenCellsRemoved */
function countRemovedInRecent(inspections: Inspection[], n: number): number {
  let count = 0
  for (let i = 0; i < Math.min(n, inspections.length); i++) {
    const removed = (inspections[i].queen_cells_removed as string[] | null) ?? []
    if (removed.length > 0) count++
  }
  return count
}

export const swarmingFever: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  const removed = (insp.queen_cells_removed as string[] | null) ?? []
  if (removed.length === 0) return null

  let score = 2 // base: cells removed
  const factors: string[] = []

  // closed_cell = advanced stage
  if (removed.includes('closed_cell')) {
    score += 2
    factors.push('cellæ opercolate tolte')
  }
  // larvae_cup = developing
  if (removed.includes('larvae_cup')) {
    score += 1
    factors.push('cellæ con larva')
  }
  // Strong population = more swarm pressure
  if (insp.population === 'forte') {
    score += 1
    factors.push('popolazione forte')
  }
  // Peak swarming season (apr-may in northern hemisphere)
  const month = ctx.today.getMonth()
  if (month === 3 || month === 4) {
    score += 1
    factors.push('periodo di picco sciamatura')
  }
  // Pollen incoming = colony feels rich
  if (insp.pollen_importation === true) {
    score += 1
    factors.push('importazione polline attiva')
  }
  // Carnica race = prone
  if (ctx.hive.bee_race === 'carnica') {
    score += 1
    factors.push('razza Carnica')
  }
  // Pattern: cells removed in ≥2 of last 3 inspections
  const recents = ctx.recentInspections ?? []
  if (countRemovedInRecent(recents, 3) >= 2) {
    score += 2
    factors.push('celle tolte in ispezioni consecutive')
  }

  const severity = score >= 6 ? 'critical' as const
    : score >= 4 ? 'warning' as const
    : 'info' as const

  const titles: Record<string, string> = {
    critical: 'Febbre sciamatoria alta',
    warning: 'Febbre sciamatoria in aumento',
    info: 'Febbre sciamatoria bassa',
  }

  const descs: Record<string, string> = {
    critical: 'Rischio sciamatura imminente. Intervento rapido consigliato.',
    warning: 'Segnali di febbre sciamatoria in aumento. Monitora e considera interventi preventivi.',
    info: 'Leggeri segnali di febbre sciamatoria. Tieni d\'occhio la colonia.',
  }

  return {
    id: 'swarming-fever',
    severity,
    category: 'swarming',
    title: titles[severity],
    description: `${descs[severity]} Fattori: ${factors.join(', ')}.`,
    reason: `score = ${score} (base celle tolte + aggravanti)`,
    ...(severity !== 'info' && { dueByDays: 7 }),
  }
}

export const swarmingProneRaceSpring: Rule = (ctx) => {
  if (ctx.hive.bee_race !== 'carnica') return null
  if (getSeason(ctx.today, ctx.apiaryLat) !== 'primavera') return null
  return {
    id: 'swarm-prone-race-spring',
    severity: 'info',
    category: 'swarming',
    title: 'Razza tendente a sciamatura',
    description: 'La razza Carnica in primavera tende a sciamare. Ispezioni più ravvicinate consigliate per prevenire la sciamatura.',
    reason: "bee_race === 'carnica' AND stagione = primavera",
  }
}
