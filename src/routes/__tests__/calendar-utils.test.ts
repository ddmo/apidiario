import { describe, it, expect } from 'vitest'

const MONTH_LABELS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const DOW_LABELS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // Monday-based: Mon=0 … Sun=6
  const cells: number[] = []
  for (let i = 0; i < startDow; i++) cells.push(0)
  for (let d = 1; d <= lastDay; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(0)
  const rows: number[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

describe('isoDate', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 4, 10))).toBe('2026-05-10')
  })

  it('pads single-digit month and day', () => {
    expect(isoDate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })

  it('formats end of year', () => {
    expect(isoDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('buildGrid', () => {
  it('returns 5 rows of 7 columns for Jan 2026', () => {
    const grid = buildGrid(2026, 0) // January 2026
    expect(grid.length).toBe(5)
    grid.forEach((row) => expect(row.length).toBe(7))
  })

  it('starts on Monday-based week: Jan 1 2026 is Thursday → 3 padding days', () => {
    // Jan 1 2026 = Thursday. Monday=0, Thu=3 → startDow=3 → 3 zeroes
    const grid = buildGrid(2026, 0)
    const firstRow = grid[0]
    expect(firstRow![0]).toBe(0)
    expect(firstRow![1]).toBe(0)
    expect(firstRow![2]).toBe(0)
    expect(firstRow![3]).toBe(1) // Jan 1 is Thu (index 3)
  })

  it('contains all days of the month', () => {
    const grid = buildGrid(2026, 0) // January: 31 days
    const days = grid.flat().filter((d) => d > 0)
    expect(days.length).toBe(31)
    expect(days[0]).toBe(1)
    expect(days[days.length - 1]).toBe(31)
  })

  it('handles February in a non-leap year (2026)', () => {
    const grid = buildGrid(2026, 1) // February 2026: 28 days
    const days = grid.flat().filter((d) => d > 0)
    expect(days.length).toBe(28)
  })

  it('pads trailing cells so total is divisible by 7', () => {
    const grid = buildGrid(2026, 1) // February 2026
    const total = grid.flat().length
    expect(total % 7).toBe(0)
    // Some trailing cells should be 0
    const lastRow = grid[grid.length - 1]!
    const trailing = lastRow.filter((d) => d === 0)
    expect(trailing.length).toBeGreaterThan(0)
  })
})

describe('MONTH_LABELS', () => {
  it('has 12 Italian month labels', () => {
    expect(MONTH_LABELS).toEqual([
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    ])
  })
})

describe('DOW_LABELS', () => {
  it('has 7 Italian day abbreviations starting Monday', () => {
    expect(DOW_LABELS).toEqual(['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'])
  })
})
