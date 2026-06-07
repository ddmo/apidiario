import { describe, it, expect } from 'vitest'
import { pathologyFollowup, varroaTreatmentWindow, varroaCountMissingInSeason } from '../rules/health'
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
  notes: null, has_queen_cells: false, queen_cells_removed: [], queen_cells_remaining: [], pollen_importation: null,
  behavior: null, pathologies: null,
  varroa_count: null, varroa_count_method: null,
  melari_count: 0, interventions: [],
  weather_summary: null, temperature_c: null,
  empty_frame_count: null,
}

describe('pathologyFollowup', () => {
  it('activates when pathologies present', () => {
    const c = ctx({ lastInspection: { ...INSP, pathologies: ['varroa', 'nosema'] } })
    expect(pathologyFollowup(c)).toMatchObject({ id: 'pathology-followup', severity: 'warning', dueByDays: 7 })
  })

  it('does not activate when pathologies empty', () => {
    const c = ctx({ lastInspection: { ...INSP, pathologies: [] } })
    expect(pathologyFollowup(c)).toBeNull()
  })

  it('does not activate when pathologies null', () => {
    const c = ctx({ lastInspection: { ...INSP, pathologies: null } })
    expect(pathologyFollowup(c)).toBeNull()
  })

  it('does not activate when no inspection', () => {
    expect(pathologyFollowup(ctx())).toBeNull()
  })
})

describe('varroaTreatmentWindow', () => {
  it('activates when varroa count exceeds threshold for caduta_naturale', () => {
    const c = ctx({ lastInspection: { ...INSP, varroa_count: 5, varroa_count_method: 'caduta_naturale' } })
    expect(varroaTreatmentWindow(c)).toMatchObject({ id: 'varroa-treatment-window', severity: 'warning', dueByDays: 14 })
  })

  it('does not activate when varroa count below threshold', () => {
    const c = ctx({ lastInspection: { ...INSP, varroa_count: 2, varroa_count_method: 'caduta_naturale' } })
    expect(varroaTreatmentWindow(c)).toBeNull()
  })

  it('does not activate when varroa count is exactly threshold', () => {
    const c = ctx({ lastInspection: { ...INSP, varroa_count: 3, varroa_count_method: 'caduta_naturale' } })
    expect(varroaTreatmentWindow(c)).toBeNull()
  })

  it('does not activate when varroa count is null', () => {
    const c = ctx({ lastInspection: { ...INSP, varroa_count: null } })
    expect(varroaTreatmentWindow(c)).toBeNull()
  })

  it('uses stricter threshold for lavaggio_alcol', () => {
    const c = ctx({ lastInspection: { ...INSP, varroa_count: 3, varroa_count_method: 'lavaggio_alcol' } })
    expect(varroaTreatmentWindow(c)).toMatchObject({ id: 'varroa-treatment-window' })
  })
})

describe('varroaCountMissingInSeason', () => {
  it('activates in July with no varroa count', () => {
    const c = ctx({
      lastInspection: { ...INSP, varroa_count: null },
      today: new Date('2026-07-15'),
    })
    expect(varroaCountMissingInSeason(c)).toMatchObject({
      id: 'varroa-count-missing-in-season',
      severity: 'warning',
      dueByDays: 14,
    })
  })

  it('does not activate when varroa count exists', () => {
    const c = ctx({
      lastInspection: { ...INSP, varroa_count: 2 },
      today: new Date('2026-07-15'),
    })
    expect(varroaCountMissingInSeason(c)).toBeNull()
  })

  it('does not activate outside July-September', () => {
    const c = ctx({
      lastInspection: { ...INSP, varroa_count: null },
      today: new Date('2026-05-15'),
    })
    expect(varroaCountMissingInSeason(c)).toBeNull()
  })

  it('does not activate when recent inspection has varroa count in history', () => {
    const c = ctx({
      lastInspection: { ...INSP, varroa_count: null },
      recentInspections: [{ ...INSP, varroa_count: 2 }],
      today: new Date('2026-08-01'),
    })
    expect(varroaCountMissingInSeason(c)).toBeNull()
  })
})
