import type { Rule } from '../types'

export const postSwarmQueenCheck: Rule = (ctx) => {
  if (ctx.hive.status !== 'sciamata') return null
  const updatedAt = ctx.hive.updated_at
  if (!updatedAt) return null
  const daysSinceSwarm = Math.floor((ctx.today.getTime() - new Date(updatedAt).getTime()) / 86_400_000)
  if (daysSinceSwarm < 21 || daysSinceSwarm > 35) return null
  return {
    id: 'post-swarm-queen-check',
    severity: 'warning',
    category: 'queen',
    title: 'Verifica nuova regina',
    description: `L'arnia è sciamata da circa ${daysSinceSwarm} giorni. Verifica la presenza di una nuova regina ovificante (uova fresche, covata opercolata uniforme).`,
    reason: `status = sciamata, giorni da updated_at ≈ ${daysSinceSwarm} (tra 21 e 35)`,
    dueByDays: 7,
  }
}
