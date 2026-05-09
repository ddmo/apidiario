import type { Enums } from '@/types/database'

export type InspectionMode = 'express' | 'standard'

export type QueenSeen = Enums<'queen_seen_state'>
export type PopulationStrength = Enums<'population_strength'>
export type QueenCells = Enums<'queen_cells_type'>
export type BehaviorType = Enums<'behavior_type'>
export type VarroaMethod = Enums<'varroa_count_method'>
export type PathologyType = Enums<'pathology'>

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
}

export type InspectionFormState = {
  queen: QueenSeen
  hasBrood: boolean
  brood: BroodState
  population: PopulationStrength
  notes: string
  // standard-only
  frames: FrameState
  queenCells: QueenCells
  pathologies: Set<PathologyType>
  pollenIncoming: boolean
  varroaCount: string
  varroaMethod: VarroaMethod
  behavior: BehaviorType
  interventions: Set<string>
}

export const DEFAULT_STATE: InspectionFormState = {
  queen: 'non_cercata',
  hasBrood: true,
  brood: { uova: null, larve: null, opercolata: null },
  population: 'media',
  notes: '',
  frames: { covata: 0, miele: 0, polline: 0 },
  queenCells: 'nessuna',
  pathologies: new Set(),
  pollenIncoming: false,
  varroaCount: '',
  varroaMethod: 'caduta_naturale',
  behavior: 'calmo',
  interventions: new Set(),
}
