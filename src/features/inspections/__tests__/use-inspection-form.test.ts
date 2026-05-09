import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInspectionForm } from '../use-inspection-form'
import type { InspectionFormState } from '../types'

const PARTIAL_STATE: Partial<InspectionFormState> = {
  queen: 'vista',
  population: 'forte',
  notes: 'test',
}

describe('useInspectionForm', () => {
  it('initializes with DEFAULT_STATE when no prefill', () => {
    const { result } = renderHook(() => useInspectionForm())

    expect(result.current.state.queen).toBe('non_cercata')
    expect(result.current.state.population).toBe('media')
    expect(result.current.state.notes).toBe('')
    expect(result.current.mode).toBe('express')
    expect(result.current.hasChanges).toBe(false)
  })

  it('merges prefillState over defaults', () => {
    const { result } = renderHook(() => useInspectionForm({ prefillState: PARTIAL_STATE }))

    expect(result.current.state.queen).toBe('vista')
    expect(result.current.state.population).toBe('forte')
    expect(result.current.state.notes).toBe('test')
    // not overridden — stays default
    expect(result.current.state.frames.covata).toBe(0)
  })

  it('uses initialMode when provided', () => {
    const { result } = renderHook(() =>
      useInspectionForm({ prefillState: PARTIAL_STATE, initialMode: 'standard' }),
    )

    expect(result.current.mode).toBe('standard')
  })

  it('hasChanges is false initially', () => {
    const { result } = renderHook(() => useInspectionForm())

    expect(result.current.hasChanges).toBe(false)
  })

  it('hasChanges becomes true after update', () => {
    const { result } = renderHook(() => useInspectionForm())

    act(() => {
      result.current.update('population', 'forte')
    })

    expect(result.current.hasChanges).toBe(true)
    expect(result.current.dirtyFields.has('population')).toBe(true)
    expect(result.current.state.population).toBe('forte')
  })

  it('markClean clears all dirty fields', () => {
    const { result } = renderHook(() => useInspectionForm())

    act(() => {
      result.current.update('population', 'forte')
      result.current.update('queen', 'vista')
    })
    expect(result.current.hasChanges).toBe(true)

    act(() => {
      result.current.markClean()
    })

    expect(result.current.hasChanges).toBe(false)
    expect(result.current.dirtyFields.size).toBe(0)
    // state values preserved
    expect(result.current.state.population).toBe('forte')
    expect(result.current.state.queen).toBe('vista')
  })

  it('reset reverts to initial state and clears dirty fields', () => {
    const { result } = renderHook(() => useInspectionForm({ prefillState: PARTIAL_STATE }))

    act(() => {
      result.current.update('queen', 'non_vista')
      result.current.update('notes', 'changed')
    })
    expect(result.current.hasChanges).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.hasChanges).toBe(false)
    expect(result.current.state.queen).toBe('vista') // back to prefill
    expect(result.current.state.notes).toBe('test') // back to prefill
  })

  it('setMode switches between express and standard', () => {
    const { result } = renderHook(() => useInspectionForm({ initialMode: 'express' }))

    act(() => {
      result.current.setMode('standard')
    })

    expect(result.current.mode).toBe('standard')
  })

  it('setShowSheet toggles the sheet visibility', () => {
    const { result } = renderHook(() => useInspectionForm())

    act(() => {
      result.current.setShowSheet(true)
    })
    expect(result.current.showSheet).toBe(true)

    act(() => {
      result.current.setShowSheet(false)
    })
    expect(result.current.showSheet).toBe(false)
  })
})
