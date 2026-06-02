import { describe, it, expect } from 'vitest'
import { weakPopulation, lowHoneyStoresPreWinter, lowPollenSpring } from '../rules/stores'
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
  brood_frame_count: 5, honey_frame_count: 3, pollen_frame_count: 2,
  notes: null, queen_cells: null, pollen_importation: null,
  behavior: null, pathologies: null,
  varroa_count: null, varroa_count_method: null,
  melari_count: 0, interventions: [],
  weather_summary: null, temperature_c: null,
  empty_frame_count: null,
}

describe('weakPopulation', () => {
  it('activates when population is debole', () => {
    const c = ctx({ lastInspection: { ...INSP, population: 'debole' } })
    expect(weakPopulation(c)).toMatchObject({ id: 'weak-population', severity: 'warning', dueByDays: 7 })
  })

  it('does not activate when population is media', () => {
    const c = ctx({ lastInspection: { ...INSP, population: 'media' } })
    expect(weakPopulation(c)).toBeNull()
  })

  it('does not activate when population is forte', () => {
    const c = ctx({ lastInspection: { ...INSP, population: 'forte' } })
    expect(weakPopulation(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(weakPopulation(ctx())).toBeNull()
  })
})

describe('lowHoneyStoresPreWinter', () => {
  it('activates in October with honey_frame_count <= 2', () => {
    const c = ctx({
      lastInspection: { ...INSP, honey_frame_count: 2 },
      today: new Date('2026-10-15'),
    })
    expect(lowHoneyStoresPreWinter(c)).toMatchObject({ id: 'low-honey-stores-pre-winter', severity: 'warning', dueByDays: 14 })
  })

  it('activates in September with low honey', () => {
    const c = ctx({
      lastInspection: { ...INSP, honey_frame_count: 1 },
      today: new Date('2026-09-01'),
    })
    expect(lowHoneyStoresPreWinter(c)).toMatchObject({ id: 'low-honey-stores-pre-winter' })
  })

  it('activates in November with zero honey', () => {
    const c = ctx({
      lastInspection: { ...INSP, honey_frame_count: 0 },
      today: new Date('2026-11-30'),
    })
    expect(lowHoneyStoresPreWinter(c)).toMatchObject({ id: 'low-honey-stores-pre-winter' })
  })

  it('does not activate when honey_frame_count > 2', () => {
    const c = ctx({
      lastInspection: { ...INSP, honey_frame_count: 3 },
      today: new Date('2026-10-15'),
    })
    expect(lowHoneyStoresPreWinter(c)).toBeNull()
  })

  it('does not activate outside September-November', () => {
    const c = ctx({
      lastInspection: { ...INSP, honey_frame_count: 1 },
      today: new Date('2026-08-15'),
    })
    expect(lowHoneyStoresPreWinter(c)).toBeNull()
  })

  it('does not activate when honey_frame_count is null', () => {
    const c = ctx({
      lastInspection: { ...INSP, honey_frame_count: null },
      today: new Date('2026-10-15'),
    })
    expect(lowHoneyStoresPreWinter(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(lowHoneyStoresPreWinter(ctx({ today: new Date('2026-10-15') }))).toBeNull()
  })
})

describe('lowPollenSpring', () => {
  it('activates in March with pollen_frame_count <= 1', () => {
    const c = ctx({
      lastInspection: { ...INSP, pollen_frame_count: 1 },
      today: new Date('2026-03-15'),
    })
    expect(lowPollenSpring(c)).toMatchObject({ id: 'low-pollen-spring', severity: 'info' })
  })

  it('activates in February with zero pollen', () => {
    const c = ctx({
      lastInspection: { ...INSP, pollen_frame_count: 0 },
      today: new Date('2026-02-01'),
    })
    expect(lowPollenSpring(c)).toMatchObject({ id: 'low-pollen-spring' })
  })

  it('does not activate when pollen_frame_count > 1', () => {
    const c = ctx({
      lastInspection: { ...INSP, pollen_frame_count: 2 },
      today: new Date('2026-03-15'),
    })
    expect(lowPollenSpring(c)).toBeNull()
  })

  it('does not activate outside February-April', () => {
    const c = ctx({
      lastInspection: { ...INSP, pollen_frame_count: 1 },
      today: new Date('2026-05-15'),
    })
    expect(lowPollenSpring(c)).toBeNull()
  })

  it('does not activate when pollen_frame_count is null', () => {
    const c = ctx({
      lastInspection: { ...INSP, pollen_frame_count: null },
      today: new Date('2026-03-15'),
    })
    expect(lowPollenSpring(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(lowPollenSpring(ctx({ today: new Date('2026-03-15') }))).toBeNull()
  })
})
