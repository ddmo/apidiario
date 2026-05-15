import type { InspectionFormState, InspectionMode } from '../types'

export type BatchStep = 'select-hives' | 'base-form' | 'review'

export type BatchInspectionState = {
  apiaryId: string
  selectedHiveIds: string[]
  baseValues: InspectionFormState
  mode: InspectionMode
  perHiveOverrides: Record<string, Partial<InspectionFormState>>
  perHiveNotes: Record<string, string>
  step: BatchStep
}
