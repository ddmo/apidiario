import { describe, it, expect } from 'vitest'
import { swarmingRoyalCellsFollowup, swarmingProneRaceSpring } from '../rules/swarming'
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
  batch_id: null,
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

describe('swarmingRoyalCellsFollowup', () => {
  it('activates when queen_cells present and 5+ days passed', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells: 'sciamatura' },
      daysSinceLastInspection: 5,
    })
    expect(swarmingRoyalCellsFollowup(c)).toMatchObject({
      id: 'royal-cells-followup',
      severity: 'critical',
      dueByDays: 7,
    })
  })

  it('does not activate when less than 5 days passed', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells: 'sciamatura' },
      daysSinceLastInspection: 3,
    })
    expect(swarmingRoyalCellsFollowup(c)).toBeNull()
  })

  it('does not activate when queen_cells is nessuna', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells: 'nessuna' },
      daysSinceLastInspection: 7,
    })
    expect(swarmingRoyalCellsFollowup(c)).toBeNull()
  })

  it('does not activate when queen_cells is null', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells: null },
      daysSinceLastInspection: 7,
    })
    expect(swarmingRoyalCellsFollowup(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(swarmingRoyalCellsFollowup(ctx())).toBeNull()
  })
})

describe('swarmingProneRaceSpring', () => {
  it('activates for carnica in spring', () => {
    const c = ctx({
      hive: { ...ctx().hive, bee_race: 'carnica' },
      today: new Date('2026-04-15'),
    })
    expect(swarmingProneRaceSpring(c)).toMatchObject({
      id: 'swarm-prone-race-spring',
      severity: 'info',
    })
  })

  it('does not activate for ligustica in spring', () => {
    const c = ctx({
      hive: { ...ctx().hive, bee_race: 'ligustica' },
      today: new Date('2026-04-15'),
    })
    expect(swarmingProneRaceSpring(c)).toBeNull()
  })

  it('does not activate for carnica in summer', () => {
    const c = ctx({
      hive: { ...ctx().hive, bee_race: 'carnica' },
      today: new Date('2026-07-15'),
    })
    expect(swarmingProneRaceSpring(c)).toBeNull()
  })
})
