import type { Rule } from '../types'

export const pollenTrapCheck: Rule = (ctx) => {
  if (!ctx.hive.has_pollen_trap) return null
  return {
    id: 'pollen-trap-check',
    severity: 'info',
    category: 'equipment',
    title: 'Verifica trappola polline',
    description: 'La trappola per polline è installata. Controlla se è piena e svuotala per mantenere la raccolta attiva.',
    reason: 'has_pollen_trap = true',
  }
}

export const propolisNetCheck: Rule = (ctx) => {
  if (!ctx.hive.has_propolis_net) return null
  return {
    id: 'propolis-net-check',
    severity: 'info',
    category: 'equipment',
    title: 'Verifica rete propoli',
    description: 'La rete per propoli è installata. Verifica se è il momento di raccoglierla e sostituirla.',
    reason: 'has_propolis_net = true',
  }
}
