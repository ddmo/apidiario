import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { useReminders, useReminder, useCompletedReminders, useCompleteReminder, useDeleteReminder, useCreateReminder, useUpdateReminder } from '@/features/reminders/hooks/use-reminders'
import { ReminderCard } from '@/features/reminders/components/reminder-card'
import { ReminderForm } from '@/features/reminders/components/reminder-form'
import type { ReminderFormData } from '@/features/reminders/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useIsTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/promemoria')({
  component: PromemoriaPage,
})

type PanelView = 'detail' | 'new' | 'edit'

function PromemoriaPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { showToast } = useToast()
  const { data: reminders, isLoading } = useReminders()
  const { data: completed } = useCompletedReminders()
  const completeReminder = useCompleteReminder()
  const deleteReminder = useDeleteReminder()
  const createReminder = useCreateReminder()
  const updateReminder = useUpdateReminder()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const isTablet = useIsTablet()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelView, setPanelView] = useState<PanelView>('detail')
  const selected = reminders?.find((r) => r.id === selectedId)
  const { data: selectedDetail } = useReminder(panelView === 'edit' ? selectedId ?? undefined : undefined)

  function handleComplete(id: string) {
    completeReminder.mutate(id)
  }

  function handleDelete(id: string) {
    setDeleteId(id)
  }

  function confirmDelete() {
    if (deleteId) {
      deleteReminder.mutate(deleteId)
      setDeleteId(null)
    }
  }

  function openNew() {
    if (isTablet) {
      setPanelView('new')
    } else {
      void navigate({ to: '/promemoria/new' })
    }
  }

  function openEdit(id: string) {
    setSelectedId(id)
    setPanelView('edit')
  }

  function handleCreate(data: ReminderFormData) {
    if (!session?.user?.id) return
    createReminder.mutate(
      {
        user_id: session.user.id,
        title: data.title,
        description: data.description || null,
        due_at: data.due_at,
        recurrence: data.recurrence,
        scope: data.scope,
        apiary_id: data.apiary_id || null,
        hive_id: data.hive_id || null,
      },
      {
        onSuccess: () => {
          showToast('Promemoria salvato', 'success')
          setPanelView('detail')
        },
        onError: () => showToast('Salvataggio fallito', 'error'),
      },
    )
  }

  function handleUpdate(data: ReminderFormData) {
    if (!selectedDetail) return
    updateReminder.mutate(
      {
        id: selectedDetail.id,
        title: data.title,
        description: data.description || null,
        due_at: data.due_at,
        recurrence: data.recurrence,
        scope: data.scope,
        apiary_id: data.apiary_id || null,
        hive_id: data.hive_id || null,
        push_enabled: selectedDetail.push_enabled,
      },
      {
        onSuccess: () => {
          showToast('Promemoria aggiornato', 'success')
          setPanelView('detail')
        },
        onError: () => showToast('Salvataggio fallito', 'error'),
      },
    )
  }

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 pl-4 pr-2 h-14 flex items-center gap-1">
        <h1 className="font-display text-lg font-medium text-wood-800 tracking-tight flex-1">Promemoria</h1>
        <button
          type="button"
          onClick={openNew}
          className="hidden tablet:flex h-9 px-3 items-center gap-1.5 rounded-md bg-honey-500 text-cream-50 text-sm font-medium hover:bg-honey-600 transition-colors mr-1"
        >
          <Plus size={16} strokeWidth={2} />
          Nuovo promemoria
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 tablet:flex tablet:items-start tablet:pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-wood-400 w-full">
            Caricamento…
          </div>
        ) : !reminders || reminders.length === 0 ? (
          <>
            <div className="px-4 pt-12 max-w-[360px] mx-auto w-full tablet:mx-0 tablet:w-[360px] tablet:shrink-0 tablet:border-r tablet:border-cream-200 tablet:h-full">
              <EmptyState
                icon={<Bell size={40} strokeWidth={1.25} />}
                title="Nessun promemoria in sospeso"
                description="Aggiungi un promemoria per non dimenticare trattamenti, ispezioni o altre attività."
              />
            </div>
            <div className="hidden tablet:flex tablet:flex-1 tablet:min-w-0 tablet:h-full tablet:flex-col">
              {panelView === 'new' && session?.user?.id && (
                <ReminderForm
                  title="Nuovo promemoria"
                  hideHeader
                  onSave={handleCreate}
                  onCancel={() => setPanelView('detail')}
                  isPending={createReminder.isPending}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-4 pt-4 flex flex-col gap-2 tablet:w-[360px] tablet:shrink-0 tablet:border-r tablet:border-cream-200 tablet:h-full tablet:overflow-y-auto">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  onClick={() => { if (isTablet) { setSelectedId(r.id); setPanelView('detail') } }}
                  className={cn(isTablet && 'cursor-pointer', selectedId === r.id && panelView !== 'new' && 'tablet:ring-2 tablet:ring-honey-500 tablet:rounded-xl')}
                >
                  <ReminderCard
                    reminder={r}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={isTablet ? openEdit : undefined}
                  />
                </div>
              ))}

              {completed && completed.length > 0 && (
                <div className="border-t border-cream-200 pt-4 mt-2">
                  <h2 className="text-sm font-medium text-wood-400 mb-3">Completati</h2>
                  <div className="flex flex-col gap-2 opacity-60">
                    {completed.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-cream-200 bg-cream-100 px-4 py-3"
                      >
                        <p className="text-sm text-wood-500 line-through">{r.title}</p>
                        <p className="text-xs text-wood-300 mt-0.5">
                          Completato il {new Date(r.completed_at!).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dettaglio / form — tablet/desktop */}
            <div className="hidden tablet:flex tablet:flex-1 tablet:min-w-0 tablet:h-full tablet:flex-col">
              {panelView === 'new' && session?.user?.id ? (
                <ReminderForm
                  title="Nuovo promemoria"
                  hideHeader
                  onSave={handleCreate}
                  onCancel={() => setPanelView('detail')}
                  isPending={createReminder.isPending}
                />
              ) : panelView === 'edit' && selectedDetail ? (
                <ReminderForm
                  title="Modifica promemoria"
                  hideHeader
                  initialData={{
                    title: selectedDetail.title,
                    description: selectedDetail.description ?? '',
                    due_at: selectedDetail.due_at,
                    recurrence: selectedDetail.recurrence,
                    scope: selectedDetail.scope,
                    apiary_id: selectedDetail.apiary_id ?? '',
                    hive_id: selectedDetail.hive_id ?? '',
                  }}
                  onSave={handleUpdate}
                  onCancel={() => setPanelView('detail')}
                  isPending={updateReminder.isPending}
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-5 flex">
                  {selected ? (
                    <div className="w-full max-w-xl">
                      {(() => {
                        const scopeLabel = selected.scope === 'hive'
                          ? [selected.apiary_name, selected.hive_identifier].filter(Boolean).join(' · ') || 'Arnia'
                          : selected.scope === 'apiary'
                          ? selected.apiary_name ?? 'Apiario'
                          : 'Generale'

                        const due = new Date(selected.due_at)
                        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
                        const now = new Date()
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                        const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000)
                        const status = diffDays < 0
                          ? { label: `In ritardo di ${Math.abs(diffDays)} g`, tone: 'danger' as const }
                          : diffDays === 0
                          ? { label: 'Oggi', tone: 'warning' as const }
                          : diffDays === 1
                          ? { label: 'Domani', tone: 'warning' as const }
                          : { label: `Tra ${diffDays} giorni`, tone: diffDays <= 7 ? 'warning' as const : 'neutral' as const }
                        const statusClasses = {
                          danger: 'bg-danger-100 text-danger-500 border-danger-100',
                          warning: 'bg-warning-100 text-warning-500 border-warning-500/30',
                          neutral: 'bg-cream-100 text-wood-800 border-cream-200',
                        }[status.tone]

                        return (
                          <>
                            <h2 className="text-2xl font-semibold text-wood-800 mb-0.5">{selected.title}</h2>
                            <p className="text-sm text-wood-400 mb-5">{scopeLabel}</p>

                            <div className="grid grid-cols-2 gap-3.5 mb-4">
                              <div className="bg-cream-100 border border-cream-200 rounded-xl px-3.5 py-3">
                                <p className="text-[11px] text-wood-400">Scadenza</p>
                                <p className="text-sm font-semibold text-wood-800 mt-0.5">
                                  {due.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <div className={cn('border rounded-xl px-3.5 py-3', statusClasses)}>
                                <p className="text-[11px] opacity-80">Stato</p>
                                <p className="text-sm font-semibold mt-0.5">{status.label}</p>
                              </div>
                            </div>

                            {selected.description && (
                              <div className="bg-cream-50 border border-cream-200 rounded-xl px-4 py-3 mb-6">
                                <p className="text-sm text-wood-600 leading-relaxed">{selected.description}</p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleComplete(selected.id)}
                                className="h-10 px-5 flex items-center justify-center rounded-md bg-honey-500 text-cream-50 text-sm font-medium hover:bg-honey-600 transition-colors"
                              >
                                Segna come fatto
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(selected.id)}
                                className="h-10 px-5 flex items-center justify-center rounded-md border border-cream-200 text-wood-700 text-sm font-medium hover:bg-cream-100 transition-colors"
                              >
                                Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(selected.id)}
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
                    <p className="text-sm text-wood-400 m-auto">Seleziona un promemoria per vedere il dettaglio</p>
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
          label="Nuovo promemoria"
          onClick={openNew}
        />
      </div>

      {deleteId && (
        <>
          <div
            className="fixed inset-0 z-30 bg-wood-900/40"
            onClick={() => setDeleteId(null)}
            aria-hidden="true"
          />
          <div role="dialog" aria-modal="true" aria-label="Elimina promemoria" className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg animate-slide-up">
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">Elimina promemoria</h2>
              <p className="text-sm text-wood-500 leading-relaxed">Non potrai più recuperarlo.</p>
            </div>
            <div className="px-4 flex flex-col gap-2" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full h-13 flex items-center justify-center gap-2 rounded-md font-medium bg-danger-500 text-cream-50 hover:bg-danger-500/90 transition-colors"
              >
                Elimina
              </button>
              <Button variant="ghost" size="md" onClick={() => setDeleteId(null)} className="w-full">
                Annulla
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
