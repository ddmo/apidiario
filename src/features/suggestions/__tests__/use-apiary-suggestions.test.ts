import { describe, it, expect } from 'vitest'
import { computeSuggestions } from '../hooks/use-apiary-suggestions'
import type { Hive, Inspection } from '@/lib/suggestions/types'

function makeHive(overrides: Partial<Hive> = {}): Hive {
  return {
    id: 'h1',
    identifier: 'A1',
    bee_race: 'ligustica',
    hive_type: 'dadant_blatt',
    status: 'attiva',
    melari_count: 0,
    has_pollen_trap: false,
    has_propolis_net: false,
    has_apiscampo: false,
    nido_frame_count: 10,
    apiary_id: 'a1',
    installed_on: '2026-03-01',
    origin_notes: null,
    notes: null,
    archived_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as unknown as Hive
}

function makeInsp(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: 'i1',
    hive_id: 'h1',
    performed_by: 'u1',
    performed_at: '2026-05-01T10:00:00Z',
    created_at: '2026-05-01T10:00:00Z',
    updated_at: '2026-05-01T10:00:00Z',
    queen_seen: 'vista',
    brood_eggs: true,
    brood_larvae: true,
    brood_capped: true,
    population: 'media',
    brood_frame_count: null,
    honey_frame_count: null,
    pollen_frame_count: null,
    notes: null,
    queen_cells: null,
    pollen_importation: null,
    behavior: null,
    pathologies: null,
    varroa_count: null,
    varroa_count_method: null,
    melari_count: 0,
    interventions: [],
    weather_summary: null,
    temperature_c: null,
    ...overrides,
  } as unknown as Inspection
}

const today = new Date('2026-05-09')

describe('computeSuggestions', () => {
  it('returns first-inspection-needed for hive with no inspection', () => {
    const hive = makeHive({ installed_on: '2026-04-01' })
    const result = computeSuggestions([hive], [], today)
    expect(result).toHaveLength(1)
    expect(result[0]!.lastInspection).toBeNull()
    expect(result[0]!.suggestions.map((s) => s.id)).toContain('first-inspection-needed')
  })

  it('returns weak-population when population is debole', () => {
    const hive = makeHive()
    const insp = makeInsp({ population: 'debole' as const })
    const result = computeSuggestions([hive], [insp], today)
    expect(result[0]!.suggestions.map((s) => s.id)).toContain('weak-population')
  })

  it('returns pathology-followup when pathologies present', () => {
    const hive = makeHive()
    const insp = makeInsp({ pathologies: ['varroa'] as any })
    const result = computeSuggestions([hive], [insp], today)
    expect(result[0]!.suggestions.map((s) => s.id)).toContain('pathology-followup')
  })

  it('returns melari-check when melari_count > 0', () => {
    const hive = makeHive({ melari_count: 2 })
    const result = computeSuggestions([hive], [], today)
    expect(result[0]!.suggestions.map((s) => s.id)).toContain('melari-check')
  })

  it('returns pollen-trap-check when trap installed', () => {
    const hive = makeHive({ has_pollen_trap: true })
    const result = computeSuggestions([hive], [], today)
    expect(result[0]!.suggestions.map((s) => s.id)).toContain('pollen-trap-check')
  })

  it('returns empty suggestions for healthy hive with no triggers', () => {
    const hive = makeHive({ installed_on: null })
    const insp = makeInsp()
    const result = computeSuggestions([hive], [insp], today)
    // No installed_on → no first-inspection-needed
    // Normal population, no pathologies → no triggers
    // But lastInspection exists and daysSinceLastInspection = 8 in May → overdueInspectionActiveSeason triggers if >14...
    // Let's check: days between May 1 and May 9 = 8 days, so NOT > 14 → no trigger
    // queen_seen is 'vista' → no queen triggers
    // So: empty or just equipment/harvest info...
    // Actually: melari_count=0, no equipment → empty
    expect(result[0]!.suggestions).toEqual([])
  })

  it('groups suggestions by hive', () => {
    const h1 = makeHive({ id: 'h1', identifier: 'A1' })
    const h2 = makeHive({ id: 'h2', identifier: 'A2', melari_count: 2 })
    const i1 = makeInsp({ id: 'i1', hive_id: 'h1', population: 'debole' as const })
    const result = computeSuggestions([h1, h2], [i1], today)
    expect(result).toHaveLength(2)
    expect(result[0]!.hive.id).toBe('h1')
    expect(result[0]!.suggestions.map((s) => s.id)).toContain('weak-population')
    expect(result[1]!.hive.id).toBe('h2')
    expect(result[1]!.suggestions.map((s) => s.id)).toContain('melari-check')
  })

  it('uses only the latest inspection per hive', () => {
    const hive = makeHive()
    const older = makeInsp({ id: 'i-old', performed_at: '2026-04-01T10:00:00Z', population: 'debole' as const })
    const newer = makeInsp({ id: 'i-new', performed_at: '2026-05-01T10:00:00Z', population: 'media' as const })
    const result = computeSuggestions([hive], [newer, older], today)
    // newer comes first in sorted array (desc order), so it's used as lastInspection
    expect(result[0]!.lastInspection!.id).toBe('i-new')
    expect(result[0]!.suggestions.map((s) => s.id)).not.toContain('weak-population')
  })

  it('computes daysSinceLastInspection correctly', () => {
    const hive = makeHive()
    const insp = makeInsp({ performed_at: '2026-04-23T10:00:00Z' })
    const result = computeSuggestions([hive], [insp], today)
    // April 24 → May 9 = 15 days, March-Sept → overdueInspectionActiveSeason triggers
    expect(result[0]!.suggestions.map((s) => s.id)).toContain('overdue-inspection-active-season')
  })

  it('returns empty array when no hives', () => {
    expect(computeSuggestions([], [], today)).toEqual([])
  })
})
