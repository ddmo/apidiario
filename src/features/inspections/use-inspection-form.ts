import { useState } from 'react'
import type { InspectionFormState, InspectionMode } from './types'
import { DEFAULT_STATE } from './types'

interface UseInspectionFormOptions {
  prefillState?: Partial<InspectionFormState>
  initialMode?: InspectionMode
}

export function useInspectionForm({ prefillState, initialMode }: UseInspectionFormOptions = {}) {
  const initialState: InspectionFormState = prefillState
    ? { ...DEFAULT_STATE, ...prefillState }
    : DEFAULT_STATE

  const [state, setState] = useState<InspectionFormState>(initialState)
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<InspectionMode>(initialMode ?? 'express')
  const [showSheet, setShowSheet] = useState(false)

  const hasChanges = dirtyFields.size > 0

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
