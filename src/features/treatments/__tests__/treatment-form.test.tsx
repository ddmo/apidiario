import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreatmentForm } from '../components/treatment-form'
import type { ToastContextValue } from '@/contexts/toast-context'
import { ToastContext } from '@/contexts/toast-context'
import type { TreatmentDetail } from '../hooks/use-treatments'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockApiaries = [
  { id: 'apiary-1', name: 'Apiario Monte', hiveCount: 3, photoUrl: null, sharedCount: 0 },
  { id: 'apiary-2', name: 'Apiario Valle', hiveCount: 5, photoUrl: null, sharedCount: 0 },
]

const mockHives = [
  { id: 'hive-1', identifier: 'A1', apiaryId: 'apiary-1' },
  { id: 'hive-2', identifier: 'A2', apiaryId: 'apiary-1' },
  { id: 'hive-3', identifier: 'B1', apiaryId: 'apiary-1' },
]

vi.mock('@/features/apiaries/hooks/use-apiaries', () => ({
  useApiaries: () => ({ data: mockApiaries }),
}))

vi.mock('@/features/hives/hooks/use-hives', () => ({
  useHivesByApiary: () => ({ data: mockHives }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const toastContext: ToastContextValue = {
  showToast: vi.fn(),
}

function renderForm(props: Partial<Parameters<typeof TreatmentForm>[0]> = {}) {
  const onSave = vi.fn()
  const onCancel = vi.fn()
  const user = userEvent.setup()
  const result = render(
    <ToastContext.Provider value={toastContext}>
      <TreatmentForm
        userId="user-1"
        onSave={onSave}
        onCancel={onCancel}
        {...props}
      />
    </ToastContext.Provider>,
  )
  return { ...result, onSave, onCancel, user }
}

function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  return user.selectOptions(screen.getByLabelText(label), value)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TreatmentForm — layout', () => {
  it('renders "Nuovo trattamento" header for new treatment', () => {
    renderForm()
    expect(screen.getByText('Nuovo trattamento')).toBeInTheDocument()
  })

  it('renders "Modifica trattamento" header for existing treatment', () => {
    const treatment = {
      id: 't-1',
      productName: 'Apivar',
      startDate: '2026-05-01',
      endDate: null,
      blocksMelari: true,
      appliesToAllHives: true,
      dosageNotes: null,
      costEur: null,
      notes: null,
      apiaryId: 'apiary-1',
      apiaryName: 'Apiario Monte',
      performedBy: 'user-1',
      performerName: '',
      hives: [],
      createdAt: '2026-04-25T10:00:00Z',
    } satisfies TreatmentDetail

    renderForm({ treatment })
    expect(screen.getByText('Modifica trattamento')).toBeInTheDocument()
  })

  it('disables apiary select when prefillApiaryId provided', () => {
    renderForm({ prefillApiaryId: 'apiary-1' })
    expect(screen.getByLabelText('Apiario')).toBeDisabled()
  })

  it('apiary select is enabled when editing (can change apiary)', () => {
    const treatment = {
      id: 't-1', productName: '', startDate: '', endDate: null,
      blocksMelari: true, appliesToAllHives: true,
      dosageNotes: null, costEur: null, notes: null,
      apiaryId: 'apiary-1', apiaryName: '', performedBy: '', performerName: '',
      hives: [], createdAt: '',
    } satisfies TreatmentDetail
    renderForm({ treatment })
    expect(screen.getByLabelText('Apiario')).toBeEnabled()
  })
})

describe('TreatmentForm — scope and hive selection', () => {
  it('shows "Tutto apiario" scope by default (segmented control)', () => {
    renderForm()
    expect(screen.getByText('Tutto apiario')).toBeInTheDocument()
  })

  it('hides hive selection when scope is "Tutto apiario"', () => {
    renderForm()
    expect(screen.queryByText('Arnie')).not.toBeInTheDocument()
  })

  it('shows hive buttons when scope is "specific"', async () => {
    const { user } = renderForm()
    // Select an apiary first so hives load
    await selectOption(user, 'Apiario', 'apiary-1')
    // Switch scope to specific
    await user.click(screen.getByText('Arnie specifiche'))

    expect(screen.getByText('Arnie')).toBeInTheDocument()
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('A2')).toBeInTheDocument()
  })

  it('clears selected hives when switching back to "all"', async () => {
    const { user } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')
    await user.click(screen.getByText('Arnie specifiche'))

    // Select a hive
    await user.click(screen.getByText('A1'))
    expect(screen.getByText('A1')).toHaveAttribute('aria-pressed', 'true')

    // Switch back to all
    await user.click(screen.getByText('Tutto apiario'))
    await user.click(screen.getByText('Arnie specifiche'))

    // Hive should not be selected anymore
    expect(screen.getByText('A1')).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows "Seleziona prima un apiario" when no apiary selected', async () => {
    const { user } = renderForm()
    await user.click(screen.getByText('Arnie specifiche'))
    expect(screen.getByText('Seleziona prima un apiario.')).toBeInTheDocument()
  })
})

describe('TreatmentForm — blocksMelari toggle', () => {
  it('renders blocksMelari toggle with active state by default', () => {
    renderForm()
    const btn = screen.getByRole('button', { name: /blocca melari attivo/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles blocksMelari state on click', async () => {
    const { user } = renderForm()
    const btn = screen.getByRole('button', { name: /blocca melari attivo/i })
    await user.click(btn)
    expect(screen.getByText('Blocca melari disattivato')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /blocca melari disattivato/i })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('TreatmentForm — validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when product name is empty', async () => {
    const { user } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')

    // Fill start date but leave product empty
    const startInput = screen.getByLabelText('Data inizio')
    await user.clear(startInput)
    await user.type(startInput, '2026-05-10')

    // Try to save
    await user.click(screen.getByText('Salva trattamento'))

    expect(toastContext.showToast).toHaveBeenCalledWith(
      expect.stringContaining('prodotto'),
      'error',
    )
  })

  it('shows error when no apiary selected', async () => {
    const { user } = renderForm()
    await user.click(screen.getByText('Salva trattamento'))
    expect(toastContext.showToast).toHaveBeenCalledWith(
      expect.stringContaining('apiario'),
      'error',
    )
  })

  it('shows error when start date is missing', async () => {
    const { user } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    await user.click(screen.getByText('Salva trattamento'))
    expect(toastContext.showToast).toHaveBeenCalledWith(
      expect.stringContaining('data'),
      'error',
    )
  })

  it('shows error when scope=specific and no hives selected', async () => {
    const { user } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')
    await user.click(screen.getByText('Arnie specifiche'))
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    const startInput = screen.getByLabelText('Data inizio')
    await user.clear(startInput)
    await user.type(startInput, '2026-05-10')
    await user.click(screen.getByText('Salva trattamento'))
    expect(toastContext.showToast).toHaveBeenCalledWith(
      expect.stringContaining('arnia'),
      'error',
    )
  })
})

describe('TreatmentForm — save flow', () => {
  it('disables save button in edit mode when no changes', () => {
    const treatment = {
      id: 't-1', productName: 'Apivar', startDate: '2026-05-01', endDate: null,
      blocksMelari: true, appliesToAllHives: true,
      dosageNotes: null, costEur: null, notes: null,
      apiaryId: 'apiary-1', apiaryName: '', performedBy: '', performerName: '',
      hives: [], createdAt: '',
    } satisfies TreatmentDetail
    renderForm({ treatment })
    const saveBtn = screen.getByText('Salva modifiche')
    expect(saveBtn).toBeDisabled()
  })

  it('enables save button in edit mode after making changes', async () => {
    const treatment = {
      id: 't-1', productName: 'Apivar', startDate: '2026-05-01', endDate: null,
      blocksMelari: true, appliesToAllHives: true,
      dosageNotes: null, costEur: null, notes: null,
      apiaryId: 'apiary-1', apiaryName: '', performedBy: '', performerName: '',
      hives: [], createdAt: '',
    } satisfies TreatmentDetail
    const { user } = renderForm({ treatment })
    await user.type(screen.getByLabelText('Prodotto'), ' cambiato')
    const saveBtn = screen.getByText('Salva modifiche')
    expect(saveBtn).toBeEnabled()
  })

  it('calls onSave with correct data for new treatment', async () => {
    const { user, onSave } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    const startInput = screen.getByLabelText('Data inizio')
    await user.clear(startInput)
    await user.type(startInput, '2026-05-10')
    await user.click(screen.getByText('Salva trattamento'))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    expect(onSave).toHaveBeenCalledWith({
      apiaryId: 'apiary-1',
      productName: 'Apivar',
      blocksMelari: true,
      appliesToAllHives: true,
      startDate: '2026-05-10',
      endDate: null,
      dosageNotes: null,
      costEur: null,
      notes: null,
      hiveIds: [],
    })
  })

  it('calls onSave with hiveIds when scope=specific', async () => {
    const { user, onSave } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')
    await user.click(screen.getByText('Arnie specifiche'))
    await user.type(screen.getByLabelText('Prodotto'), 'Api-Bioxal')
    const startInput = screen.getByLabelText('Data inizio')
    await user.clear(startInput)
    await user.type(startInput, '2026-06-01')
    // Select two hives
    await user.click(screen.getByText('A1'))
    await user.click(screen.getByText('A2'))
    await user.click(screen.getByText('Salva trattamento'))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      appliesToAllHives: false,
      hiveIds: ['hive-1', 'hive-2'],
    }))
  })

  it('calls onSave with custom cost and end date', async () => {
    const { user, onSave } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    const startInput = screen.getByLabelText('Data inizio')
    await user.clear(startInput)
    await user.type(startInput, '2026-05-10')
    const endInput = screen.getByLabelText(/Data fine/)
    await user.clear(endInput)
    await user.type(endInput, '2026-05-24')
    await user.type(screen.getByLabelText('Costo (€)'), '12.50')
    await user.click(screen.getByText('Salva trattamento'))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      endDate: '2026-05-24',
      costEur: 12.5,
    }))
  })

  it('passes dosageNotes and notes as strings', async () => {
    const { user, onSave } = renderForm()
    await selectOption(user, 'Apiario', 'apiary-1')
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    const startInput = screen.getByLabelText('Data inizio')
    await user.clear(startInput)
    await user.type(startInput, '2026-05-01')
    await user.type(screen.getByLabelText('Dosaggio'), '2 strisce per arnia')
    await user.type(screen.getByLabelText('Note'), 'Fare attenzione')
    await user.click(screen.getByText('Salva trattamento'))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      dosageNotes: '2 strisce per arnia',
      notes: 'Fare attenzione',
    }))
  })
})

describe('TreatmentForm — unsaved changes', () => {
  it('calls onCancel directly when no changes made', async () => {
    const { user, onCancel } = renderForm()
    await user.click(screen.getByLabelText('Indietro'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows unsaved changes sheet when form is dirty', async () => {
    const { user } = renderForm()
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    await user.click(screen.getByLabelText('Indietro'))
    expect(screen.getByText('Modifiche non salvate')).toBeInTheDocument()
  })

  it('calls onCancel when "Esci senza salvare" selected', async () => {
    const { user, onCancel } = renderForm()
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    await user.click(screen.getByLabelText('Indietro'))
    await user.click(screen.getByText('Esci senza salvare'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('hides unsaved sheet when "Annulla" clicked in sheet', async () => {
    const { user } = renderForm()
    await user.type(screen.getByLabelText('Prodotto'), 'Apivar')
    await user.click(screen.getByLabelText('Indietro'))
    // Two "Annulla" buttons exist: footer + sheet. Pick sheet one (last).
    const annullaBtns = screen.getAllByText('Annulla')
    await user.click(annullaBtns[annullaBtns.length - 1]!)
    expect(screen.queryByText('Modifiche non salvate')).not.toBeInTheDocument()
  })
})
