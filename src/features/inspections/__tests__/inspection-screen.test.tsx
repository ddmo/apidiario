import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InspectionScreen } from '../inspection-screen'
import type { InspectionFormState } from '../types'

// Leaflet produce error in jsdom — mock
vi.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Circle: () => null,
  useMap: () => null,
}))

const hiveInfo = { identifier: 'A1', apiaryName: 'Test' }

function renderScreen(props: Partial<Parameters<typeof InspectionScreen>[0]> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onBack = vi.fn()
  const user = userEvent.setup()
  const result = render(
    <InspectionScreen
      hiveId="hive-1"
      hiveInfo={hiveInfo}
      hasPrefill={false}
      onSave={onSave}
      onBack={onBack}
      {...props}
    />,
  )
  return { ...result, onSave, onBack, user }
}

describe('InspectionScreen', () => {
  it('renders header with hive info', () => {
    renderScreen()
    expect(screen.getByText('A1')).toBeInTheDocument()
  })

  it('renders save button disabled when no changes', () => {
    renderScreen()
    const btn = screen.getByRole('button', { name: /salva ispezione/i })
    expect(btn).toBeDisabled()
  })

  it('shows Express mode by default', () => {
    renderScreen()
    expect(screen.getByRole('radio', { name: /express/i })).toBeChecked()
  })

  it('enables save button after modifying a field', async () => {
    const { user } = renderScreen()

    // Click "Forte" in popolazione segmented control
    const forteBtn = screen.getByRole('radio', { name: /forte/i })
    await user.click(forteBtn)

    const saveBtn = screen.getByRole('button', { name: /salva ispezione/i })
    expect(saveBtn).toBeEnabled()
  })

  it('calls onSave with current state and mode', async () => {
    const { user, onSave } = renderScreen()

    // Change population to trigger dirty
    await user.click(screen.getByRole('radio', { name: /forte/i }))
    await user.click(screen.getByRole('button', { name: /salva ispezione/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const [stateArg, modeArg] = onSave.mock.calls[0] as [InspectionFormState, string, (id: string) => Promise<void>]
    expect(modeArg).toBe('express')
    expect(stateArg.population).toBe('forte')
  })

  it('shows loading state while saving', async () => {
    // Simulate slow save
    const onSave = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 100)))
    renderScreen({ onSave, isSaving: true })

    // When isSaving is true externally, loading state shown
    const btn = screen.getByRole('button', { name: /salvataggio/i })
    expect(btn).toBeInTheDocument()
  })

  it('calls onBack directly when no changes', async () => {
    const { user, onBack } = renderScreen()

    await user.click(screen.getByLabelText('Indietro'))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows unsaved changes sheet when back with dirty fields', async () => {
    const { user } = renderScreen()

    // Make a change first
    await user.click(screen.getByRole('radio', { name: /forte/i }))

    // Try to go back
    await user.click(screen.getByLabelText('Indietro'))

    // Unsaved changes dialog should appear
    expect(screen.getByText(/modifiche non salvate/i)).toBeInTheDocument()
  })

  it('delete button hidden when onDelete not provided', () => {
    renderScreen({ onDelete: undefined })
    expect(screen.queryByLabelText('Altre opzioni')).not.toBeInTheDocument()
  })

  it('delete button visible when onDelete provided', () => {
    renderScreen({ onDelete: vi.fn() })
    expect(screen.getByLabelText('Altre opzioni')).toBeInTheDocument()
  })

  it('shows weather fields in standard mode when weather provided', async () => {
    const { user } = renderScreen({ weather: { temperature: 22, summary: 'sereno, umidità 51%, vento 15 km/h' } })

    // Switch to standard mode
    await user.click(screen.getByRole('radio', { name: /standard/i }))

    expect(screen.getByText('Meteo')).toBeInTheDocument()
    expect(screen.getAllByText('22°C').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('sereno, umidità 51%, vento 15 km/h')).toBeInTheDocument()
  })

  it('hides weather fields in express mode', () => {
    renderScreen({ weather: { temperature: 22, summary: 'sereno' } })
    expect(screen.queryByText('Meteo')).not.toBeInTheDocument()
  })
})
