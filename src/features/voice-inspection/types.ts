import type { InspectionFormState } from '@/features/inspections/types'

export interface VoiceInspectionContext {
  hiveId?: string
}

export interface VoiceInspectionResponse {
  success: boolean
  data?: Partial<InspectionFormState>
  transcript?: string
  error?: string
  context?: VoiceInspectionContext
}

export type VoiceInspectionStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'success'
  | 'error'
