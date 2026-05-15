import { useState, useCallback } from 'react'
import { DEFAULT_STATE } from '../types'
import type { InspectionFormState, InspectionMode } from '../types'
import type { BatchStep, BatchInspectionState } from './types'

function createInitialState(apiaryId: string, preSelectedIds?: string[]): BatchInspectionState {
  return {
    apiaryId,
    selectedHiveIds: preSelectedIds ?? [],
    baseValues: { ...DEFAULT_STATE },
    mode: 'express',
    perHiveOverrides: {},
    perHiveNotes: {},
    step: preSelectedIds && preSelectedIds.length > 0 ? 'base-form' : 'select-hives',
  }
}

export function useBatchInspection(apiaryId: string, preSelectedIds?: string[]) {
  const [state, setState] = useState<BatchInspectionState>(() => createInitialState(apiaryId, preSelectedIds))

  const setSelectedHiveIds = useCallback((ids: string[]) => {
    setState((prev) => ({ ...prev, selectedHiveIds: ids }))
  }, [])

  const setStep = useCallback((step: BatchStep) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  const setBaseValues = useCallback((values: InspectionFormState, mode: InspectionMode) => {
    setState((prev) => ({ ...prev, baseValues: values, mode }))
  }, [])

  const setHiveOverride = useCallback((hiveId: string, override: Partial<InspectionFormState>) => {
    setState((prev) => {
      const next = { ...prev.perHiveOverrides }
      next[hiveId] = override
      return { ...prev, perHiveOverrides: next }
    })
  }, [])

  const removeHiveOverride = useCallback((hiveId: string) => {
    setState((prev) => {
      const next = { ...prev.perHiveOverrides }
      delete next[hiveId]
      return { ...prev, perHiveOverrides: next }
    })
  }, [])

  const setHiveNote = useCallback((hiveId: string, note: string) => {
    setState((prev) => ({
      ...prev,
      perHiveNotes: { ...prev.perHiveNotes, [hiveId]: note },
    }))
  }, [])

  const removeHiveNote = useCallback((hiveId: string) => {
    setState((prev) => {
      const next = { ...prev.perHiveNotes }
      delete next[hiveId]
      return { ...prev, perHiveNotes: next }
    })
  }, [])

  const reset = useCallback(() => {
    setState(createInitialState(apiaryId))
  }, [apiaryId])

  const getEffectiveValues = useCallback(
    (hiveId: string): InspectionFormState => {
      const override = state.perHiveOverrides[hiveId]
      return override ? { ...state.baseValues, ...override } : state.baseValues
    },
    [state.baseValues, state.perHiveOverrides],
  )

  const isCustomized = useCallback(
    (hiveId: string): boolean => {
      return hiveId in state.perHiveOverrides
    },
    [state.perHiveOverrides],
  )

  const customizedCount = Object.keys(state.perHiveOverrides).length

  return {
    state,
    setSelectedHiveIds,
    setStep,
    setBaseValues,
    setHiveOverride,
    removeHiveOverride,
    setHiveNote,
    removeHiveNote,
    reset,
    getEffectiveValues,
    isCustomized,
    customizedCount,
  }
}
