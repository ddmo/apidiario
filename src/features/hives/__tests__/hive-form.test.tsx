import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HiveForm } from '../components/hive-form'
import type { ToastContextValue } from '@/contexts/toast-context'
import { ToastContext } from '@/contexts/toast-context'

const toastContext: ToastContextValue = { showToast: vi.fn() }

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockHives = [
  { id: 'hive-1', identifier: 'A1', apiaryId: 'apiary-1', hiveType: 'dadant_blatt', beeRace: 'ligustica', nidoFrameCount: 10, melariCount: 0, status: 'attiva', hasApiscampo: false, hasPropolisNet: false, hasPollenTrap: false, hasActiveQueen: 'non_cercata', lastInspection: null },
  { id: 'hive-2', identifier: 'B1', apiaryId: 'apiary-1', hiveType: 'dadant_blatt', beeRace: 'ligustica', nidoFrameCount: 10, melariCount: 0, status: 'attiva', hasApiscampo: false, hasPropolisNet: false, hasPollenTrap: false, hasActiveQueen: 'non_cercata', lastInspection: null },
]

const mockUpdateHive = vi.fn((_args, options) => {
  options?.onSuccess?.()
})
const mockCreateHive = vi.fn()

vi.mock('../hooks/use-hives', () => ({
  useHivesByApiary: () => ({ data: mockHives, isLoading: false }),
  useCreateHive: () => ({ mutate: mockCreateHive, isPending: false }),
  useUpdateHive: () => ({ mutate: mockUpdateHive, isPending: false }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const apiaries = [
  { id: 'apiary-1', name: 'Apiario Monte' },
  { id: 'apiary-2', name: 'Apiario Valle' },
]

function renderEditForm(apiaryList = apiaries) {
  const onSuccess = vi.fn()
  const onCancel = vi.fn()
  const user = userEvent.setup()

  render(
    <ToastContext.Provider value={toastContext}>
      <HiveForm
        apiaryId="apiary-1"
        apiaries={apiaryList}
        userId="user-1"
        hive={{
          id: 'hive-1',
          identifier: 'A1',
          hive_type: 'dadant_blatt',
          bee_race: 'ligustica',
          installed_on: null,
          origin_notes: null,
          nido_frame_count: 10,
          notes: null,
        }}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </ToastContext.Provider>,
  )
  return { onSuccess, onCancel, user }
}

function renderCreateForm() {
  const onSuccess = vi.fn()
  const onCancel = vi.fn()
  const user = userEvent.setup()

  render(
    <ToastContext.Provider value={toastContext}>
      <HiveForm
        apiaryId="apiary-1"
        userId="user-1"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </ToastContext.Provider>,
  )
  return { onSuccess, onCancel, user }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HiveForm — apiary picker (sposta arnia)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not show apiary select in create mode', () => {
    renderCreateForm()
    expect(screen.queryByLabelText('Apiario')).not.toBeInTheDocument()
  })

  it('does not show apiary select when only one apiary exists', () => {
    renderEditForm([{ id: 'apiary-1', name: 'Solo Apiario' }])
    expect(screen.queryByLabelText('Apiario')).not.toBeInTheDocument()
  })

  it('shows apiary select in edit mode when multiple apiaries exist', () => {
    renderEditForm()
    expect(screen.getByLabelText('Apiario')).toBeInTheDocument()
  })

  it('pre-selects current apiary in the picker', () => {
    renderEditForm()
    const select = screen.getByLabelText('Apiario') as HTMLSelectElement
    expect(select.value).toBe('apiary-1')
  })

  it('saves with new apiaryId when changed', async () => {
    const { user, onSuccess } = renderEditForm()

    // Change apiary
    await user.selectOptions(screen.getByLabelText('Apiario'), 'apiary-2')
    // Save
    await user.click(screen.getByText('Salva modifiche'))

    await waitFor(() => {
      expect(mockUpdateHive).toHaveBeenCalledTimes(1)
    })

    expect(mockUpdateHive).toHaveBeenCalledWith(
      expect.objectContaining({ apiaryId: 'apiary-2' }),
      expect.anything(),
    )
  })

  it('calls onSuccess after saving with new apiary', async () => {
    const { user, onSuccess } = renderEditForm()

    await user.selectOptions(screen.getByLabelText('Apiario'), 'apiary-2')
    await user.click(screen.getByText('Salva modifiche'))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
