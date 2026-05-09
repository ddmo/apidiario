import { describe, it, expect } from 'vitest'
import { pollenTrapCheck, propolisNetCheck } from '../rules/equipment'
import type { SuggestionContext } from '../types'

function ctx(overrides: Partial<SuggestionContext> = {}): SuggestionContext {
  return {
    hive: { id: 'h1', identifier: 'A1', bee_race: 'ligustica', hive_type: 'dadant_blatt', status: 'attiva', melari_count: 0, has_pollen_trap: false, has_propolis_net: false, has_apiscampo: false, nido_frame_count: 10, apiary_id: 'a1', installed_on: null, origin_notes: null, notes: null, archived_at: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    lastInspection: null,
    daysSinceLastInspection: null,
    today: new Date('2026-05-09'),
    ...overrides,
  } as unknown as SuggestionContext
}

describe('pollenTrapCheck', () => {
  it('activates when has_pollen_trap is true', () => {
    const c = ctx({ hive: { ...ctx().hive, has_pollen_trap: true } })
    expect(pollenTrapCheck(c)).toMatchObject({ id: 'pollen-trap-check', severity: 'info', category: 'equipment' })
  })

  it('does not activate when has_pollen_trap is false', () => {
    expect(pollenTrapCheck(ctx())).toBeNull()
  })
})

describe('propolisNetCheck', () => {
  it('activates when has_propolis_net is true', () => {
    const c = ctx({ hive: { ...ctx().hive, has_propolis_net: true } })
    expect(propolisNetCheck(c)).toMatchObject({ id: 'propolis-net-check', severity: 'info', category: 'equipment' })
  })

  it('does not activate when has_propolis_net is false', () => {
    expect(propolisNetCheck(ctx())).toBeNull()
  })
})
