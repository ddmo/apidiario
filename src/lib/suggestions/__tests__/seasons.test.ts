import { describe, it, expect } from 'vitest'
import { getSeason } from '../seasons'
import type { Season } from '../seasons'

describe('getSeason', () => {
  describe('northern hemisphere (default)', () => {
    it.each([
      ['2026-01-15', 'inverno'],
      ['2026-02-15', 'inverno'],
      ['2026-03-01', 'primavera'],
      ['2026-04-15', 'primavera'],
      ['2026-05-15', 'primavera'],
      ['2026-06-01', 'estate'],
      ['2026-07-15', 'estate'],
      ['2026-08-15', 'estate'],
      ['2026-09-01', 'autunno'],
      ['2026-10-15', 'autunno'],
      ['2026-11-15', 'autunno'],
      ['2026-12-01', 'inverno'],
    ] as const)('%s → %s', (dateStr, expected) => {
      expect(getSeason(new Date(dateStr))).toBe(expected)
    })
  })

  describe('northern hemisphere explicit lat', () => {
    it('returns primavera in May with lat 45', () => {
      expect(getSeason(new Date('2026-05-01'), 45)).toBe('primavera')
    })

    it('returns inverno in January with lat 45', () => {
      expect(getSeason(new Date('2026-01-01'), 45)).toBe('inverno')
    })
  })

  describe('southern hemisphere', () => {
    it.each([
      ['2026-01-15', 'estate'],
      ['2026-03-15', 'autunno'],
      ['2026-06-15', 'inverno'],
      ['2026-09-15', 'primavera'],
      ['2026-12-15', 'estate'],
    ] as const)('%s → %s (lat -33)', (dateStr, expected) => {
      expect(getSeason(new Date(dateStr), -33)).toBe(expected)
    })
  })

  describe('equator', () => {
    it('uses northern hemisphere for lat 0', () => {
      expect(getSeason(new Date('2026-07-15'), 0)).toBe('estate')
    })
  })

  describe('null/undefined lat', () => {
    it('uses northern hemisphere when lat is null', () => {
      expect(getSeason(new Date('2026-07-15'), null)).toBe('estate')
    })

    it('uses northern hemisphere when lat is undefined', () => {
      expect(getSeason(new Date('2026-07-15'), undefined)).toBe('estate')
    })
  })
})
