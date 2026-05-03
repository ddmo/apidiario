import { useState } from 'react'
import type { InspectionFormState, InspectionMode } from './types'
import { DEFAULT_STATE } from './types'

interface UseInspectionFormOptions {
  prefillState?: Partial<InspectionFormState>
  hasPrefill?: boolean
}

export function useInspectionForm({ prefillState, hasPrefill = false }: UseInspectionFormOptions = {}) {
  const initialState: InspectionFormState = prefillState
    ? { ...DEFAULT_STATE, ...prefillState }
    : DEFAULT_STATE

  const [state, setState] = useState<InspectionFormState>(initialState)
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<InspectionMode>('express')
  const [showSheet, setShowSheet] = useState(false)

  const hasChanges = dirtyFields.size > 0
  const isPrefilled = hasPrefill && !hasChanges

  function update<K extends keyof InspectionFormState>(key: K, value: InspectionFormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
    setDirtyFields((prev) => new Set([...prev, key]))
  }

  function reset() {
    setState(initialState)
    setDirtyFields(new Set())
  }

  return { state, dirtyFields, mode, setMode, update, reset, hasChanges, showSheet, setShowSheet }
}
