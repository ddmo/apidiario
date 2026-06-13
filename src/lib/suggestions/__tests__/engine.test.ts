import { describe, it, expect } from 'vitest'
import { generateSuggestions } from '../engine'
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

describe('generateSuggestions', () => {
  it('returns empty array when no rules match', () => {
    const result = generateSuggestions(ctx())
    expect(result).toEqual([])
  })

  it('returns suggestion when queen not seen', () => {
    const INSP = {
      id: 'i1', hive_id: 'h1', performed_by: 'u1',
      performed_at: '2026-05-01T10:00:00Z', created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
      batch_id: null,
      queen_seen: 'non_vista' as const,
      brood_eggs: true, brood_larvae: true, brood_capped: true,
      population: 'media' as const,
      brood_frame_count: null, honey_frame_count: null, pollen_frame_count: null,
      notes: null, has_queen_cells: false, queen_cells_removed: [], queen_cell_types: [], queen_cells_remaining: [],
      pollen_importation: null,
      behavior: null, pathologies: null,
      varroa_count: null, varroa_count_method: null,
      melari_count: 0, interventions: [],
      weather_summary: null, temperature_c: null,
      empty_frame_count: null,
    }
    const result = generateSuggestions(ctx({ lastInspection: INSP }))
    const ids = result.map((s) => s.id)
    expect(ids).toContain('queen-not-seen')
  })

  it('orders critical before warning before info', () => {
    const INSP = {
      id: 'i1', hive_id: 'h1', performed_by: 'u1',
      performed_at: '2026-04-30T10:00:00Z', created_at: '2026-04-30T10:00:00Z', updated_at: '2026-04-30T10:00:00Z',
      batch_id: null,
      queen_seen: 'non_vista' as const,
      brood_eggs: false, brood_larvae: false, brood_capped: true,
      population: 'debole' as const,
      brood_frame_count: 0, honey_frame_count: 0, pollen_frame_count: 0,
      notes: null, has_queen_cells: true, queen_cells_removed: ['dry_cup'], queen_cell_types: [], queen_cells_remaining: [], pollen_importation: null,
      behavior: null, pathologies: ['varroa' as const],
      varroa_count: 5, varroa_count_method: 'caduta_naturale' as const,
      melari_count: 0, interventions: [],
      weather_summary: null, temperature_c: null,
      empty_frame_count: null,
    }
    const result = generateSuggestions(ctx({
      lastInspection: INSP,
      daysSinceLastInspection: 9,
    }))
    expect(result.length).toBeGreaterThan(0)
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]!
      const curr = result[i]!
      if (prev.severity === curr.severity) continue
      if (prev.severity === 'critical') expect(curr.severity).not.toBe('critical')
      if (prev.severity === 'warning') expect(curr.severity).toBe('info')
    }
  })
})
