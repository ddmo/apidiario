import { describe, it, expect } from 'vitest'
import { postSwarmQueenCheck } from '../rules/season'
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

describe('postSwarmQueenCheck', () => {
  it('activates when status is sciamata and 25 days have passed', () => {
    const c = ctx({
      hive: { ...ctx().hive, status: 'sciamata', updated_at: '2026-04-14T00:00:00Z' },
      today: new Date('2026-05-09'),
    })
    expect(postSwarmQueenCheck(c)).toMatchObject({
      id: 'post-swarm-queen-check',
      severity: 'warning',
      category: 'queen',
      dueByDays: 7,
    })
  })

  it('activates at exactly 21 days', () => {
    const c = ctx({
      hive: { ...ctx().hive, status: 'sciamata', updated_at: '2026-04-18T00:00:00Z' },
      today: new Date('2026-05-09'),
    })
    expect(postSwarmQueenCheck(c)).toMatchObject({ id: 'post-swarm-queen-check' })
  })

  it('activates at exactly 35 days', () => {
    const c = ctx({
      hive: { ...ctx().hive, status: 'sciamata', updated_at: '2026-04-04T00:00:00Z' },
      today: new Date('2026-05-09'),
    })
    expect(postSwarmQueenCheck(c)).toMatchObject({ id: 'post-swarm-queen-check' })
  })

  it('does not activate when status is attiva', () => {
    const c = ctx({
      hive: { ...ctx().hive, status: 'attiva', updated_at: '2026-04-14T00:00:00Z' },
      today: new Date('2026-05-09'),
    })
    expect(postSwarmQueenCheck(c)).toBeNull()
  })

  it('does not activate when less than 21 days passed', () => {
    const c = ctx({
      hive: { ...ctx().hive, status: 'sciamata', updated_at: '2026-04-25T00:00:00Z' },
      today: new Date('2026-05-09'),
    })
    expect(postSwarmQueenCheck(c)).toBeNull()
  })

  it('does not activate when more than 35 days passed', () => {
    const c = ctx({
      hive: { ...ctx().hive, status: 'sciamata', updated_at: '2026-03-01T00:00:00Z' },
      today: new Date('2026-05-09'),
    })
    expect(postSwarmQueenCheck(c)).toBeNull()
  })
})
