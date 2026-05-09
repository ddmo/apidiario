import { describe, it, expect } from 'vitest'
import { melariCheck } from '../rules/harvest'
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

describe('melariCheck', () => {
  it('activates when melari_count > 0', () => {
    const c = ctx({ hive: { ...ctx().hive, melari_count: 2 } })
    expect(melariCheck(c)).toMatchObject({ id: 'melari-check', severity: 'warning', category: 'harvest', dueByDays: 7 })
  })

  it('activates with 1 melario', () => {
    const c = ctx({ hive: { ...ctx().hive, melari_count: 1 } })
    expect(melariCheck(c)).toMatchObject({ id: 'melari-check' })
  })

  it('does not activate when melari_count is 0', () => {
    expect(melariCheck(ctx())).toBeNull()
  })
})
