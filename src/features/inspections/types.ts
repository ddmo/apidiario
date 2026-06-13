import type { Enums } from '@/types/database'

export type InspectionMode = 'express' | 'standard'

export type QueenSeen = Enums<'queen_seen_state'>
export type PopulationStrength = Enums<'population_strength'>
export type BehaviorType = Enums<'behavior_type'>
export type VarroaMethod = Enums<'varroa_count_method'>
export type PathologyType = Enums<'pathology'>

export type VoiceNote = {
  id: string
  blob?: Blob
  url?: string
  storagePath?: string
  durationSeconds: number
  pending: boolean
}

export type BroodStage = boolean | null

export type BroodState = {
  uova: BroodStage
  larve: BroodStage
  opercolata: BroodStage
}

export type FrameState = {
  covata: number
  miele: number
  polline: number
  vuoti: number
}

export const QUEEN_CELL_OPTIONS = [
  { value: 'dry_cup', label: 'Cupolino secco' },
  { value: 'egg_cup', label: 'Cupolino con uovo' },
  { value: 'larvae_cup', label: 'Cupolino con larva' },
  { value: 'closed_cell', label: 'Cella chiusa' },
] as const

export type QueenCellType = (typeof QUEEN_CELL_OPTIONS)[number]['value']

export type InspectionFormState = {
  queen: QueenSeen
  hasBrood: boolean
  brood: BroodState
  population: PopulationStrength
  notes: string
  // standard-only
  frames: FrameState
  hasQueenCells: boolean
  queenCellsRemoved: QueenCellType[]
  queenCellsRemaining: QueenCellType[]
  pathologies: Set<PathologyType>
  pollenIncoming: boolean
  varroaCount: string
  varroaMethod: VarroaMethod
  behavior: BehaviorType
  interventions: Set<string>
  otherInterventions: string
  needsIntervention: boolean
}

export const DEFAULT_STATE: InspectionFormState = {
  queen: 'non_cercata',
  hasBrood: true,
  brood: { uova: null, larve: null, opercolata: null },
  population: 'media',
  notes: '',
  frames: { covata: 0, miele: 0, polline: 0, vuoti: 0 },
  hasQueenCells: false,
  queenCellsRemoved: [],
  queenCellsRemaining: [],
  pathologies: new Set(),
  pollenIncoming: false,
  varroaCount: '',
  varroaMethod: 'caduta_naturale',
  behavior: 'calmo',
  interventions: new Set(),
  otherInterventions: '',
  needsIntervention: false,
}
