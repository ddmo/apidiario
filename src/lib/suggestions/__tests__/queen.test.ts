import { describe, it, expect } from 'vitest'
import { queenNotSeen, suspectedOrphan, queenFailing, queenConfirmedByEggs } from '../rules/queen'
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
  queen_seen: 'non_vista' as const,
  brood_eggs: false, brood_larvae: false, brood_capped: false,
  population: 'media' as const,
  brood_frame_count: null, honey_frame_count: null, pollen_frame_count: null,
  notes: null, has_queen_cells: false, queen_cells_removed: [], queen_cell_types: [], queen_cells_remaining: [], pollen_importation: null,
  behavior: null, pathologies: null,
  varroa_count: null, varroa_count_method: null,
  melari_count: 0, interventions: [], pending_interventions: [], needs_intervention: false,
  weather_summary: null, temperature_c: null,
  empty_frame_count: null,
}

describe('queenNotSeen', () => {
  it('activates when queen_seen is non_vista', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'non_vista' } })
    expect(queenNotSeen(c)).toMatchObject({ id: 'queen-not-seen', severity: 'warning' })
  })

  it('does not activate when queen_seen is vista', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'vista' } })
    expect(queenNotSeen(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(queenNotSeen(ctx())).toBeNull()
  })

  it('does not activate when queen_seen is non_cercata', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'non_cercata' } })
    expect(queenNotSeen(c)).toBeNull()
  })
})

describe('suspectedOrphan', () => {
  it('activates when queen not seen and eggs false (brood absent)', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'non_vista', brood_eggs: false } })
    expect(suspectedOrphan(c)).toMatchObject({ id: 'suspected-orphan', severity: 'critical', dueByDays: 3 })
  })

  it('activates when queen not seen and eggs null (brood present but eggs not observed)', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'non_vista', brood_eggs: null, brood_larvae: true } })
    expect(suspectedOrphan(c)).toMatchObject({ id: 'suspected-orphan', severity: 'critical', dueByDays: 3 })
  })

  it('does not activate when queen was seen', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'vista', brood_eggs: false } })
    expect(suspectedOrphan(c)).toBeNull()
  })

  it('does not activate when eggs are confirmed present', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'non_vista', brood_eggs: true } })
    expect(suspectedOrphan(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(suspectedOrphan(ctx())).toBeNull()
  })
})

describe('queenFailing', () => {
  it('activates when no eggs, no larvae, capped present', () => {
    const c = ctx({ lastInspection: { ...INSP, brood_eggs: false, brood_larvae: false, brood_capped: true } })
    expect(queenFailing(c)).toMatchObject({ id: 'queen-failing', severity: 'warning', dueByDays: 7 })
  })

  it('does not activate when eggs present', () => {
    const c = ctx({ lastInspection: { ...INSP, brood_eggs: true, brood_larvae: false, brood_capped: true } })
    expect(queenFailing(c)).toBeNull()
  })

  it('does not activate when no capped brood', () => {
    const c = ctx({ lastInspection: { ...INSP, brood_eggs: false, brood_larvae: false, brood_capped: false } })
    expect(queenFailing(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(queenFailing(ctx())).toBeNull()
  })
})

describe('queenConfirmedByEggs', () => {
  it('activates when queen not seen but eggs present', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'non_vista', brood_eggs: true } })
    expect(queenConfirmedByEggs(c)).toMatchObject({ id: 'queen-confirmed-by-eggs', severity: 'info' })
  })

  it('does not activate when queen was seen', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'vista', brood_eggs: true } })
    expect(queenConfirmedByEggs(c)).toBeNull()
  })

  it('does not activate when no eggs', () => {
    const c = ctx({ lastInspection: { ...INSP, queen_seen: 'non_vista', brood_eggs: false } })
    expect(queenConfirmedByEggs(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(queenConfirmedByEggs(ctx())).toBeNull()
  })
})
