import { describe, it, expect } from 'vitest'
import { overdueInspectionActiveSeason, firstInspectionNeeded } from '../rules/schedule'
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

const INSP = {
  id: 'i1', hive_id: 'h1', performed_by: 'u1',
  performed_at: '2026-05-01T10:00:00Z', created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  queen_seen: 'vista' as const,
  brood_eggs: true, brood_larvae: true, brood_capped: true,
  population: 'media' as const,
  brood_frame_count: null, honey_frame_count: null, pollen_frame_count: null,
  notes: null, queen_cells: null, pollen_importation: null,
  behavior: null, pathologies: null,
  varroa_count: null, varroa_count_method: null,
  melari_count: 0, interventions: [],
  weather_summary: null, temperature_c: null,
}

describe('overdueInspectionActiveSeason', () => {
  it('activates when daysSinceLastInspection > 14 in active season', () => {
    const c = ctx({
      lastInspection: INSP,
      daysSinceLastInspection: 20,
      today: new Date('2026-06-01'),
    })
    expect(overdueInspectionActiveSeason(c)).toMatchObject({
      id: 'overdue-inspection-active-season',
      severity: 'warning',
      dueByDays: 7,
    })
  })

  it('activates in March (season boundary)', () => {
    const c = ctx({
      lastInspection: INSP,
      daysSinceLastInspection: 15,
      today: new Date('2026-03-01'),
    })
    expect(overdueInspectionActiveSeason(c)).toMatchObject({ id: 'overdue-inspection-active-season' })
  })

  it('activates in September (season boundary)', () => {
    const c = ctx({
      lastInspection: INSP,
      daysSinceLastInspection: 21,
      today: new Date('2026-09-30'),
    })
    expect(overdueInspectionActiveSeason(c)).toMatchObject({ id: 'overdue-inspection-active-season' })
  })

  it('does not activate when daysSinceLastInspection <= 14', () => {
    const c = ctx({
      lastInspection: INSP,
      daysSinceLastInspection: 14,
      today: new Date('2026-06-01'),
    })
    expect(overdueInspectionActiveSeason(c)).toBeNull()
  })

  it('does not activate outside March-September', () => {
    const c = ctx({
      lastInspection: INSP,
      daysSinceLastInspection: 20,
      today: new Date('2026-11-01'),
    })
    expect(overdueInspectionActiveSeason(c)).toBeNull()
  })

  it('does not activate when daysSinceLastInspection is null', () => {
    const c = ctx({
      lastInspection: INSP,
      daysSinceLastInspection: null,
      today: new Date('2026-06-01'),
    })
    expect(overdueInspectionActiveSeason(c)).toBeNull()
  })
})

describe('firstInspectionNeeded', () => {
  it('activates when no inspection and hive has installed_on', () => {
    const c = ctx({
      lastInspection: null,
      hive: { ...ctx().hive, installed_on: '2026-04-01' },
    })
    expect(firstInspectionNeeded(c)).toMatchObject({
      id: 'first-inspection-needed',
      severity: 'info',
      dueByDays: 7,
    })
  })

  it('does not activate when inspection exists', () => {
    const c = ctx({
      lastInspection: INSP,
      hive: { ...ctx().hive, installed_on: '2026-04-01' },
    })
    expect(firstInspectionNeeded(c)).toBeNull()
  })

  it('does not activate when installed_on is null', () => {
    const c = ctx({ lastInspection: null, hive: { ...ctx().hive, installed_on: null } })
    expect(firstInspectionNeeded(c)).toBeNull()
  })
})
