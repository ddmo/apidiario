export const EXPRESS_FIELD_OPTIONS = [
  { key: 'queen', label: 'Regina', defaultIncluded: true },
  { key: 'hasBrood', label: 'Covata', defaultIncluded: true },
  { key: 'population', label: 'Popolazione', defaultIncluded: true },
  { key: 'hasQueenCells', label: 'Celle reali', defaultIncluded: false },
  { key: 'notes', label: 'Note', defaultIncluded: true },
  { key: 'behavior', label: 'Comportamento', defaultIncluded: false },
  { key: 'pollenIncoming', label: 'Importazione polline', defaultIncluded: false },
  { key: 'pathologies', label: 'Patologie', defaultIncluded: false },
  { key: 'varroa', label: 'Conteggio varroa', defaultIncluded: false },
  { key: 'interventions', label: 'Interventi', defaultIncluded: false },
] as const

export type ExpressField = (typeof EXPRESS_FIELD_OPTIONS)[number]['key']

export const DEFAULT_EXPRESS_FIELDS: ExpressField[] = [
  'queen', 'hasBrood', 'population', 'notes',
]
