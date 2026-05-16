import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Syringe } from 'lucide-react'
import { useTreatments, useDeleteTreatment } from '@/features/treatments/hooks/use-treatments'
import { TreatmentCard } from '@/features/treatments/components/treatment-card'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/trattamenti')({
  component: TrattamentiPage,
})

function TrattamentiPage() {
  const navigate = useNavigate()
  const { data: treatments = [], isLoading } = useTreatments()
  const { mutate: deleteTreatment } = useDeleteTreatment()
  const { showToast } = useToast()

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 pl-1 pr-2 h-14 flex items-center gap-1">
        <img src="/icons/icon-no-bg.svg" alt="" className="h-14 w-14 shrink-0" />
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1">Trattamenti</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-wood-400">
            {t.common.loading}
          </div>
        ) : treatments.length === 0 ? (
          <div className="px-4 pt-12">
            <EmptyState
              icon={<Syringe size={40} strokeWidth={1.25} />}
              title="Nessun trattamento"
              description="Registra il primo trattamento sanitario per le tue arnie."
            />
          </div>
        ) : (
          <ul className="px-4 pt-4 flex flex-col gap-2">
            {treatments.map((tr) => (
              <li key={tr.id}>
                <SwipeableRow
                  revealWidth={160}
                  revealContent={
                    <div className="flex-1 flex items-stretch">
                      <Link
                        to="/trattamenti/$treatmentId/edit"
                        params={{ treatmentId: tr.id }}
                        className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#5B8FA0] text-white"
                      >
                        <span className="text-[11px] font-semibold leading-none">Modifica</span>
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
                        <span className="text-[11px] font-semibold leading-none">Elimina</span>
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
      </div>

      <Fab
        icon={<Plus size={24} strokeWidth={2} aria-hidden="true" />}
        label="Nuovo trattamento"
        onClick={() => void navigate({ to: '/trattamenti/new' })}
      />
    </div>
  )
}
