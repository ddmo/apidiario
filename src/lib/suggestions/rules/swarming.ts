import type { Rule } from '../types'
import { getSeason } from '../seasons'

export const swarmingRoyalCellsFollowup: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (insp.queen_cells == null || insp.queen_cells === 'nessuna') return null
  if ((ctx.daysSinceLastInspection ?? 0) < 5) return null
  return {
    id: 'royal-cells-followup',
    severity: 'critical',
    category: 'swarming',
    title: 'Celle reali — ricontrollo urgente',
    description: `Celle reali di ${insp.queen_cells === 'sciamatura' ? 'sciamatura' : insp.queen_cells === 'scorta' ? 'scorta' : 'sostituzione'} rilevate nell'ultima ispezione. Ricontrolla entro 7 giorni dalla visita precedente.`,
    reason: `queen_cells = ${insp.queen_cells} AND giorni dall'ispezione >= 5`,
    dueByDays: 7,
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
