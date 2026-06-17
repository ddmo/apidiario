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

export const superAddPending: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  const pending: string[] = (insp as unknown as { pending_interventions?: string[] }).pending_interventions ?? []
  if (!pending.includes('Aggiungere/Sostituire melario')) return null
  return {
    id: 'super-add-pending',
    severity: 'warning',
    category: 'equipment',
    title: 'Aggiungere/Sostituire melario',
    description: "Nell'ultima ispezione è stato segnato come intervento da eseguire. Verifica e intervieni.",
    reason: 'pending_interventions include "Aggiungere/Sostituire melario"',
  }
}
