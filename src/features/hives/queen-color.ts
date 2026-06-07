import type { Database } from '@/types/database'

type QueenMarkingColor = Database['public']['Enums']['queen_marking_color']

const YEAR_COLOR: Record<string, QueenMarkingColor> = {
  '1': 'bianco',
  '6': 'bianco',
  '2': 'giallo',
  '7': 'giallo',
  '3': 'rosso',
  '8': 'rosso',
  '4': 'verde',
  '9': 'verde',
  '5': 'blu',
  '0': 'blu',
}

const COLOR_LABELS: Record<QueenMarkingColor, string> = {
  bianco: 'Bianco',
  giallo: 'Giallo',
  rosso: 'Rosso',
  verde: 'Verde',
  blu: 'Blu',
  non_marcata: 'Non marcata',
}

export const QUEEN_COLORS = [
  { value: 'bianco', label: 'Bianco', yearEndings: '1, 6', hex: '#E8E4D8' },
  { value: 'giallo', label: 'Giallo', yearEndings: '2, 7', hex: '#E5B83A' },
  { value: 'rosso',  label: 'Rosso',  yearEndings: '3, 8', hex: '#C44F4F' },
  { value: 'verde',  label: 'Verde',  yearEndings: '4, 9', hex: '#6E8347' },
  { value: 'blu',    label: 'Blu',    yearEndings: '5, 0', hex: '#4A6FA5' },
] as const

export function queenColorFromYear(year: number): QueenMarkingColor | null {
  return YEAR_COLOR[String(year % 10)] ?? null
}

export function queenColorLabel(color: QueenMarkingColor | null | undefined): string | null {
  if (!color || color === 'non_marcata') return null
  return COLOR_LABELS[color] ?? null
}

export function queenColorHex(color: QueenMarkingColor | null | undefined): string | null {
  if (!color || color === 'non_marcata') return null
  return QUEEN_COLORS.find((c) => c.value === color)?.hex ?? null
}
