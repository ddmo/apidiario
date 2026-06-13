import { describe, it, expect } from 'vitest'
import { swarmingRoyalCellsFollowup, swarmingProneRaceSpring, swarmingFever } from '../rules/swarming'
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
  notes: null, has_queen_cells: false, queen_cells_removed: [], queen_cell_types: [], queen_cells_remaining: [],
  pollen_importation: null,
  behavior: null, pathologies: null,
  varroa_count: null, varroa_count_method: null,
  melari_count: 0, interventions: [], needs_intervention: false,
  weather_summary: null, temperature_c: null,
  empty_frame_count: null,
}

describe('swarmingRoyalCellsFollowup', () => {
  it('activates when queen cells present and 5+ days passed', () => {
    const c = ctx({
      lastInspection: { ...INSP, has_queen_cells: true, queen_cells_removed: ['dry_cup'] },
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
      lastInspection: { ...INSP, has_queen_cells: true, queen_cells_removed: ['dry_cup'] },
      daysSinceLastInspection: 3,
    })
    expect(swarmingRoyalCellsFollowup(c)).toBeNull()
  })

  it('does not activate when has_queen_cells is false', () => {
    const c = ctx({
      lastInspection: { ...INSP, has_queen_cells: false, queen_cells_removed: [], queen_cells_remaining: [] },
      daysSinceLastInspection: 7,
    })
    expect(swarmingRoyalCellsFollowup(c)).toBeNull()
  })

  it('does not activate when both arrays empty', () => {
    const c = ctx({
      lastInspection: { ...INSP, has_queen_cells: true, queen_cells_removed: [], queen_cells_remaining: [] },
      daysSinceLastInspection: 7,
    })
    expect(swarmingRoyalCellsFollowup(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(swarmingRoyalCellsFollowup(ctx())).toBeNull()
  })
})

describe('swarmingFever', () => {
  it('returns null when no inspection', () => {
    expect(swarmingFever(ctx())).toBeNull()
  })

  it('returns null when queenCellsRemoved empty', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells_removed: [] },
    })
    expect(swarmingFever(c)).toBeNull()
  })

  it('returns info for base score 2 (dry_cup removed only)', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells_removed: ['dry_cup'], population: 'media' },
      today: new Date('2026-06-15'), // fuori picco
      hive: { ...ctx().hive, bee_race: 'ligustica' },
    })
    const result = swarmingFever(c)
    expect(result).toMatchObject({ id: 'swarming-fever', severity: 'info' })
    expect(result).not.toHaveProperty('dueByDays')
  })

  it('returns warning for score 4 (larvae_cup + carnica + base)', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells_removed: ['larvae_cup'], population: 'media' },
      today: new Date('2026-06-15'),
      hive: { ...ctx().hive, bee_race: 'carnica' },
    })
    // base 2 + larvae_cup 1 + carnica 1 = 4
    expect(swarmingFever(c)).toMatchObject({ id: 'swarming-fever', severity: 'warning', dueByDays: 7 })
  })

  it('returns critical for score 6 (closed_cell + forte + carnica + base)', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells_removed: ['closed_cell'], population: 'forte' },
      today: new Date('2026-06-15'),
      hive: { ...ctx().hive, bee_race: 'carnica' },
    })
    // base 2 + closed_cell 2 + forte 1 + carnica 1 = 6
    expect(swarmingFever(c)).toMatchObject({ id: 'swarming-fever', severity: 'critical', dueByDays: 7 })
  })

  it('adds +1 for peak swarming season (april) — pushes to warning', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells_removed: ['dry_cup'], population: 'media' },
      today: new Date('2026-04-15'),
      hive: { ...ctx().hive, bee_race: 'carnica' },
    })
    // base 2 + peak 1 + carnica 1 = 4 → warning
    expect(swarmingFever(c)).toMatchObject({ id: 'swarming-fever', severity: 'warning' })
  })

  it('adds +1 for pollen importation with carnica → warning', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells_removed: ['dry_cup'], population: 'media', pollen_importation: true },
      today: new Date('2026-06-15'),
      hive: { ...ctx().hive, bee_race: 'carnica' },
    })
    // base 2 + pollen 1 + carnica 1 = 4 → warning
    expect(swarmingFever(c)).toMatchObject({ id: 'swarming-fever', severity: 'warning' })
  })

  it('adds +2 when cells removed in ≥2 of last 3 inspections', () => {
    const c = ctx({
      lastInspection: { ...INSP, queen_cells_removed: ['dry_cup'], population: 'media' },
      today: new Date('2026-06-15'),
      hive: { ...ctx().hive, bee_race: 'ligustica' },
      recentInspections: [
        { ...INSP, queen_cells_removed: ['dry_cup'] }, // current (already counted)
        { ...INSP, queen_cells_removed: ['egg_cup'] }, // previous — has cells
        { ...INSP, queen_cells_removed: [] },           // older — empty
      ],
    })
    // 2 of last 3 have cells → +2 pattern. base 2 + pattern 2 = 4 → warning
    expect(swarmingFever(c)).toMatchObject({ id: 'swarming-fever', severity: 'warning' })
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
