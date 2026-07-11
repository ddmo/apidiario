import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Syringe, AlertTriangle } from 'lucide-react'
import { useTreatments, useTreatment, useDeleteTreatment, useCreateTreatment, useUpdateTreatment, useConcludeTreatment } from '@/features/treatments/hooks/use-treatments'
import { TreatmentCard } from '@/features/treatments/components/treatment-card'
import { TreatmentForm } from '@/features/treatments/components/treatment-form'
import type { TreatmentFormData } from '@/features/treatments/components/treatment-form'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useIsTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/trattamenti')({
  component: TrattamentiPage,
})

type PanelView = 'detail' | 'new' | 'edit'

function TrattamentiPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: treatments = [], isLoading } = useTreatments()
  const { mutate: deleteTreatment } = useDeleteTreatment()
  const { mutate: createTreatment, isPending: isCreating } = useCreateTreatment()
  const { mutate: updateTreatment, isPending: isUpdating } = useUpdateTreatment()
  const { mutate: concludeTreatment, isPending: isConcluding } = useConcludeTreatment()
  const { showToast } = useToast()
  const isTablet = useIsTablet()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelView, setPanelView] = useState<PanelView>('detail')
  const selected = treatments.find((tr) => tr.id === selectedId)
  const { data: selectedDetail } = useTreatment(selectedId ?? '')
  const todayIso = new Date().toISOString().slice(0, 10)

  function openNew() {
    setPanelView('new')
  }

  function handleCreate(data: TreatmentFormData) {
    if (!session?.user?.id) return
    createTreatment(
      { ...data, userId: session.user.id },
      {
        onSuccess: (id) => {
          showToast('Trattamento salvato', 'success')
          setSelectedId(id)
          setPanelView('detail')
        },
        onError: () => showToast('Salvataggio fallito. Riprova.', 'error'),
      },
    )
  }

  function handleUpdate(data: TreatmentFormData) {
    if (!selected) return
    updateTreatment(
      { ...data, treatmentId: selected.id },
      {
        onSuccess: () => {
          showToast('Trattamento aggiornato', 'success')
          setPanelView('detail')
        },
        onError: () => showToast('Salvataggio fallito. Riprova.', 'error'),
      },
    )
  }

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 pl-4 pr-2 h-14 flex items-center gap-1">
        <h1 className="font-display text-lg font-medium text-wood-800 tracking-tight flex-1">Trattamenti</h1>
        <button
          type="button"
          onClick={openNew}
          className="hidden tablet:flex h-9 px-3 items-center gap-1.5 rounded-md bg-honey-500 text-cream-50 text-sm font-medium hover:bg-honey-600 transition-colors mr-1"
        >
          <Plus size={16} strokeWidth={2} />
          Nuovo trattamento
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 tablet:flex tablet:items-start tablet:pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-wood-400 w-full">
            {t.common.loading}
          </div>
        ) : (
          <>
            {treatments.length === 0 ? (
              <div className="px-4 pt-12 max-w-[360px] mx-auto w-full tablet:mx-0 tablet:w-[360px] tablet:shrink-0 tablet:border-r tablet:border-cream-200 tablet:h-full">
                <EmptyState
                  icon={<Syringe size={40} strokeWidth={1.25} />}
                  title="Nessun trattamento"
                  description="Registra il primo trattamento sanitario per le tue arnie."
                />
              </div>
            ) : (
              <ul className="px-4 pt-4 flex flex-col gap-2 tablet:w-[360px] tablet:shrink-0 tablet:border-r tablet:border-cream-200 tablet:h-full tablet:overflow-y-auto">
                {treatments.map((tr) => (
                  <li
                    key={tr.id}
                    onClick={() => { if (isTablet) { setSelectedId(tr.id); setPanelView('detail') } }}
                    className={cn(isTablet && 'cursor-pointer', selectedId === tr.id && panelView !== 'new' && 'tablet:ring-2 tablet:ring-honey-500 tablet:rounded-xl')}
                  >
                    <SwipeableRow
                      revealWidth={160}
                      revealContent={
                        <div className="flex-1 flex items-stretch">
                          <Link
                            to="/trattamenti/$treatmentId/edit"
                            params={{ treatmentId: tr.id }}
                            className="flex-1 flex flex-col items-center justify-center gap-1 bg-wood-500 text-white"
                          >
                            <span className="text-xs font-semibold leading-none">Modifica</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              deleteTreatment(tr.id, {
                                onSuccess: () => showToast('Trattamento eliminato', 'success'),
                                onError: () => showToast('Eliminazione fallita', 'error'),
                              })
                            }}
                            className="flex-1 flex flex-col items-center justify-center gap-1 bg-danger-500 text-white"
                          >
                            <span className="text-xs font-semibold leading-none">Elimina</span>
                          </button>
                        </div>
                      }
                    >
                      <TreatmentCard treatment={tr} />
                    </SwipeableRow>
                  </li>
                ))}
              </ul>
            )}

            {/* Dettaglio / form — tablet/desktop */}
            <div className="hidden tablet:flex tablet:flex-1 tablet:min-w-0 tablet:h-full tablet:flex-col">
              {panelView === 'new' && session?.user?.id ? (
                <TreatmentForm
                  userId={session.user.id}
                  hideHeader
                  onSave={handleCreate}
                  onCancel={() => setPanelView('detail')}
                  isPending={isCreating}
                />
              ) : panelView === 'edit' && selectedDetail && session?.user?.id ? (
                <TreatmentForm
                  userId={session.user.id}
                  treatment={selectedDetail}
                  hideHeader
                  onSave={handleUpdate}
                  onCancel={() => setPanelView('detail')}
                  isPending={isUpdating}
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-5 flex">
                  {selected && selectedDetail ? (
                    <div className="w-full max-w-xl">
                      {(() => {
                        const isOngoing = !selectedDetail.endDate || selectedDetail.endDate >= todayIso
                        const period = selectedDetail.endDate
                          ? `${new Date(selectedDetail.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} – ${new Date(selectedDetail.endDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : `${new Date(selectedDetail.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} – in corso`
                        return (
                          <>
                            <div className="flex items-center gap-2.5 mb-1">
                              <h2 className="text-2xl font-semibold text-wood-800">{selectedDetail.productName}</h2>
                              <span className={cn(
                                'text-[10px] font-semibold px-2.5 py-1 rounded-full',
                                isOngoing ? 'bg-warning-100 text-warning-500' : 'bg-success-100 text-success-500',
                              )}>
                                {isOngoing ? 'In corso' : 'Concluso'}
                              </span>
                            </div>
                            <p className="text-sm text-wood-400 mb-5">{selectedDetail.apiaryName}</p>

                            <div className="grid grid-cols-3 gap-3.5 mb-4">
                              <div className="bg-cream-100 border border-cream-200 rounded-xl px-3.5 py-3">
                                <p className="text-[11px] text-wood-400">Periodo</p>
                                <p className="text-sm font-semibold text-wood-800 mt-0.5">{period}</p>
                              </div>
                              <div className="bg-cream-100 border border-cream-200 rounded-xl px-3.5 py-3">
                                <p className="text-[11px] text-wood-400">Dosaggio</p>
                                <p className="text-sm font-semibold text-wood-800 mt-0.5">{selectedDetail.dosageNotes || '—'}</p>
                              </div>
                              <div className="bg-cream-100 border border-cream-200 rounded-xl px-3.5 py-3">
                                <p className="text-[11px] text-wood-400">Costo</p>
                                <p className="text-sm font-semibold text-wood-800 mt-0.5">
                                  {selectedDetail.costEur != null ? `€ ${selectedDetail.costEur.toFixed(2)}` : '—'}
                                </p>
                              </div>
                            </div>

                            {selectedDetail.blocksMelari && (
                              <div className="flex items-center gap-2.5 bg-warning-100 border border-warning-500/30 rounded-xl px-4 py-3 mb-4">
                                <AlertTriangle size={18} className="text-warning-500 shrink-0" />
                                <p className="text-sm text-warning-500">Blocco melari attivo — l&rsquo;app avvisa se aggiungi melari alle arnie coinvolte.</p>
                              </div>
                            )}

                            <p className="text-xs font-semibold text-wood-400 uppercase tracking-wide mb-2.5">Arnie coinvolte</p>
                            <div className="flex flex-wrap gap-2 mb-6">
                              {selectedDetail.appliesToAllHives ? (
                                <span className="text-xs font-semibold bg-cream-100 border border-cream-200 text-wood-800 px-3.5 py-2 rounded-full">
                                  Tutto l&rsquo;apiario
                                </span>
                              ) : (
                                selectedDetail.hives.map((h) => (
                                  <span key={h.hiveId} className="text-xs font-semibold bg-cream-100 border border-cream-200 text-wood-800 px-3.5 py-2 rounded-full">
                                    {h.identifier}
                                  </span>
                                ))
                              )}
                            </div>

                            <div className="flex gap-2">
                              {isOngoing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    concludeTreatment(
                                      { treatmentId: selectedDetail.id, productName: selectedDetail.productName },
                                      { onSuccess: () => showToast('Trattamento concluso', 'success'), onError: () => showToast('Operazione fallita', 'error') },
                                    )
                                  }}
                                  disabled={isConcluding}
                                  className="h-10 px-5 flex items-center justify-center rounded-md bg-honey-500 text-cream-50 text-sm font-medium hover:bg-honey-600 disabled:opacity-50 transition-colors"
                                >
                                  Concludi trattamento
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setPanelView('edit')}
                                className="h-10 px-5 flex items-center justify-center rounded-md border border-cream-200 text-wood-700 text-sm font-medium hover:bg-cream-100 transition-colors"
                              >
                                Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteTreatment(selected.id, {
                                    onSuccess: () => { showToast('Trattamento eliminato', 'success'); setSelectedId(null) },
                                    onError: () => showToast('Eliminazione fallita', 'error'),
                                  })
                                }}
                                className="h-10 px-5 flex items-center justify-center rounded-md text-danger-500 text-sm font-medium hover:bg-danger-100 transition-colors ml-auto"
                              >
                                Elimina
                              </button>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-wood-400 m-auto">Seleziona un trattamento per vedere il dettaglio</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="tablet:hidden">
        <Fab
          icon={<Plus size={24} strokeWidth={2} aria-hidden="true" />}
          label="Nuovo trattamento"
          onClick={() => void navigate({ to: '/trattamenti/new' })}
        />
      </div>
    </div>
  )
}
