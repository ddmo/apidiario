import { describe, it, expect } from 'vitest'

type QueenSeen = 'vista' | 'non_vista' | 'non_cercata'

function resolveQueen(queenSeen: string | null, hasActiveQueenInTable: boolean): boolean | 'non_cercata' {
  if (queenSeen === 'vista') return true
  if (queenSeen === 'non_cercata') return 'non_cercata'
  if (queenSeen === 'non_vista') return false
  return hasActiveQueenInTable
}

function resolveFrameCount(
  insp: { broodFrameCount: number; honeyFrameCount: number; pollenFrameCount: number } | null,
  staticNidoCount: number,
): number {
  if (insp && (insp.broodFrameCount > 0 || insp.honeyFrameCount > 0 || insp.pollenFrameCount > 0)) {
    return insp.broodFrameCount + insp.honeyFrameCount + insp.pollenFrameCount
  }
  return staticNidoCount
}

describe('resolveQueen', () => {
  it('returns true when queen was seen in latest inspection', () => {
    expect(resolveQueen('vista', false)).toBe(true)
    expect(resolveQueen('vista', true)).toBe(true)
  })

  it("returns 'non_cercata' when queen was not searched", () => {
    expect(resolveQueen('non_cercata', false)).toBe('non_cercata')
    expect(resolveQueen('non_cercata', true)).toBe('non_cercata')
  })

  it('returns false when queen was NOT seen in latest inspection', () => {
    expect(resolveQueen('non_vista', true)).toBe(false)
    expect(resolveQueen('non_vista', false)).toBe(false)
  })

  it('falls back to queens table when no inspection data', () => {
    expect(resolveQueen(null, true)).toBe(true)
    expect(resolveQueen(null, false)).toBe(false)
  })

  it('inspection overrides queens table', () => {
    // Queen in table but not seen → false (no icon)
    expect(resolveQueen('non_vista', true)).toBe(false)
    // Queen in table but vista in inspection → true (♛)
    expect(resolveQueen('vista', false)).toBe(true)
  })
})

describe('resolveFrameCount', () => {
  it('returns sum of brood+honey+pollen from inspection', () => {
    expect(resolveFrameCount({ broodFrameCount: 3, honeyFrameCount: 2, pollenFrameCount: 1 }, 10)).toBe(6)
  })

  it('returns sum even if some frame types are 0', () => {
    expect(resolveFrameCount({ broodFrameCount: 5, honeyFrameCount: 0, pollenFrameCount: 0 }, 10)).toBe(5)
  })

  it('falls back to static nido_frame_count when all inspection frames are 0', () => {
    expect(resolveFrameCount({ broodFrameCount: 0, honeyFrameCount: 0, pollenFrameCount: 0 }, 10)).toBe(10)
  })

  it('falls back to static count when no inspection exists', () => {
    expect(resolveFrameCount(null, 10)).toBe(10)
  })
})
