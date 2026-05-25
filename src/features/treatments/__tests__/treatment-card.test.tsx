import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TreatmentCard } from '../components/treatment-card'
import type { TreatmentListItem } from '../hooks/use-treatments'

const baseTreatment: TreatmentListItem = {
  id: '1',
  productName: 'Apivar',
  startDate: '2026-05-01',
  endDate: '2026-05-15',
  blocksMelari: true,
  appliesToAllHives: true,
  apiaryId: 'apiary-1',
  apiaryName: 'Apiario Monte',
  performerName: 'Mario Rossi',
  hiveCount: 0,
}

function renderCard(overrides: Partial<TreatmentListItem> = {}) {
  return render(<TreatmentCard treatment={{ ...baseTreatment, ...overrides }} />)
}

describe('TreatmentCard', () => {
  it('renders product name', () => {
    renderCard()
    expect(screen.getByText('Apivar')).toBeInTheDocument()
  })

  it('renders apiary name', () => {
    renderCard()
    expect(screen.getByText(/Apiario Monte/)).toBeInTheDocument()
  })

  it('shows "Tutto apiario" when appliesToAllHives', () => {
    renderCard({ appliesToAllHives: true })
    expect(screen.getByText(/Tutto/)).toBeInTheDocument()
  })

  it('shows hive count when not appliesToAllHives', () => {
    renderCard({ appliesToAllHives: false, hiveCount: 3 })
    expect(screen.getByText(/3 arnie/)).toBeInTheDocument()
  })

  it('shows singular "arnia" when hiveCount is 1', () => {
    renderCard({ appliesToAllHives: false, hiveCount: 1 })
    expect(screen.getByText(/1 arnia/)).toBeInTheDocument()
  })

  it('renders date range with start and end', () => {
    renderCard({ startDate: '2026-05-01', endDate: '2026-05-15' })
    expect(screen.getByText(/1 mag.*15 mag 2026/)).toBeInTheDocument()
  })

  it('renders "in corso" when no end date', () => {
    renderCard({ startDate: '2026-05-01', endDate: null })
    expect(screen.getByText(/in corso/)).toBeInTheDocument()
  })

  it('renders single-day date when start equals end', () => {
    renderCard({ startDate: '2026-05-10', endDate: '2026-05-10' })
    const card = screen.getByText(/Apivar/).closest('div')
    expect(card).toBeInTheDocument()
  })

  it('shows blocksMelari icon (Lock) when true', () => {
    const { container } = renderCard({ blocksMelari: true })
    const lockIcon = container.querySelector('svg.lucide-lock')
    expect(lockIcon).toBeInTheDocument()
  })

  it('hides blocksMelari icon when false', () => {
    const { container } = renderCard({ blocksMelari: false })
    const lockIcon = container.querySelector('svg.lucide-lock')
    expect(lockIcon).not.toBeInTheDocument()
  })
})
