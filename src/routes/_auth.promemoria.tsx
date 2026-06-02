import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Plus, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Fab } from '@/components/ui/fab'
import { useReminders, useCompletedReminders, useCompleteReminder, useDeleteReminder } from '@/features/reminders/hooks/use-reminders'
import { ReminderCard } from '@/features/reminders/components/reminder-card'

export const Route = createFileRoute('/_auth/promemoria')({
  component: PromemoriaPage,
})

function PromemoriaPage() {
  const navigate = useNavigate()
  const { data: reminders, isLoading } = useReminders()
  const { data: completed } = useCompletedReminders()
  const completeReminder = useCompleteReminder()
  const deleteReminder = useDeleteReminder()
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  return (
    <main className="min-h-dvh flex flex-col bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 pl-1 pr-2 h-14 flex items-center gap-1">
        <Link
          to="/piu"
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </Link>
        <img src="/icons/icon-no-bg.svg" alt="" className="h-14 w-14 shrink-0" />
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Promemoria
        </h1>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          {isLoading && (
            <p className="text-sm text-wood-400">Caricamento promemoria...</p>
          )}

          {!isLoading && (!reminders || reminders.length === 0) && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Bell size={40} className="text-wood-300" />
              <p className="text-sm text-wood-500">Nessun promemoria in sospeso</p>
              <p className="text-xs text-wood-400 max-w-[240px]">
                Aggiungi un promemoria per non dimenticare trattamenti, ispezioni o altre attivit&agrave;.
              </p>
              <Link
                to="/promemoria/new"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-honey-500 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-honey-600 transition-colors"
              >
                <Plus size={16} />
                Nuovo promemoria
              </Link>
            </div>
          )}

          {reminders?.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          ))}

          {completed && completed.length > 0 && (
            <>
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
            </>
          )}
        </div>
      </div>

      <Fab
        icon={<Plus size={24} />}
        label="Nuovo promemoria"
        onClick={() => void navigate({ to: '/promemoria/new' })}
      />

      {/* Delete confirmation */}
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
              <p className="text-sm text-wood-500 leading-relaxed">Non potrai pi&ugrave; recuperarlo.</p>
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
    </main>
  )
}
