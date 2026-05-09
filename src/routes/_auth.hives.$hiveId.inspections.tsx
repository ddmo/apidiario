import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useInspectionsByHive, useDeleteInspection } from '@/features/inspections/hooks/use-inspections'
import { PATHOLOGY_LABELS } from '@/features/inspections/constants'
import { EmptyState } from '@/components/ui/empty-state'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { ClipboardList } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/hives/$hiveId/inspections')({
  component: InspectionListPage,
})

function InspectionListPage() {
  const { hiveId } = Route.useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate: deleteInspection } = useDeleteInspection()

  const { data: hive } = useQuery({
    queryKey: ['hive', hiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hives')
        .select('id, identifier, apiary_id')
        .eq('id', hiveId)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: inspections = [], isLoading } = useInspectionsByHive(hiveId)

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => router.history.back()}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0 px-1">
          <p className="text-xs text-wood-400 leading-none mb-0.5">
            {t.inspection.list.title}
          </p>
          <h1 className="text-2xl font-bold text-wood-800 tracking-tight truncate leading-tight">
            {hive?.identifier ?? '…'}
          </h1>
        </div>
        <Link
          to="/inspections/$hiveId/new"
          params={{ hiveId }}
          className="size-11 flex items-center justify-center text-wood-600 hover:bg-cream-100 rounded-md transition-colors"
          aria-label={t.inspection.list.newBtn}
        >
          <Plus size={22} strokeWidth={1.75} />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-wood-400">
            {t.common.loading}
          </div>
        ) : inspections.length === 0 ? (
          <div className="px-4 pt-12">
            <EmptyState
              icon={<ClipboardList size={40} strokeWidth={1.25} />}
              title={t.inspection.list.empty}
              description={t.inspection.list.emptyDescription}
            />
          </div>
        ) : (
          <ul className="px-4 pt-4 flex flex-col gap-2">
            {inspections.map((insp) => {
              const date = new Date(insp.performed_at)
              const calendarDay = date.getDate()
              const calendarMonth = date.toLocaleDateString('it-IT', { month: 'short' })
              const pathologies = insp.pathologies ?? []
              const queenLabel = `Regina ${(t.inspection.queenSeen as Record<string, string>)[insp.queen_seen] ?? insp.queen_seen}`.toLowerCase()
              const popLabel = (t.inspection.population as Record<string, string>)[insp.population] ?? insp.population

              function handleDelete(inspectionId: string) {
                deleteInspection(
                  { inspectionId, hiveId },
                  {
                    onSuccess: () => showToast('Ispezione eliminata', 'success'),
                    onError: (err) => {
                      console.error('[InspectionList] delete failed', err)
                      showToast('Eliminazione fallita', 'error')
                    },
                  },
                )
              }

              return (
                <li key={insp.id}>
                  <SwipeableRow
                    revealWidth={84}
                    revealContent={
                      <button
                        type="button"
                        onClick={() => handleDelete(insp.id)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 bg-danger-500 text-white"
                      >
                        <Trash2 size={18} strokeWidth={1.75} />
                        <span className="text-[11px] font-semibold leading-none">Elimina</span>
                      </button>
                    }
                  >
                    <Link
                      to="/hives/$hiveId/inspections/$inspectionId"
                      params={{ hiveId, inspectionId: insp.id }}
                      className="block bg-cream-100 border border-cream-200 px-4 py-3 active:bg-cream-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Calendar badge */}
                        <div className="flex flex-col items-center w-11 shrink-0 rounded-lg overflow-hidden border border-cream-300 bg-cream-50">
                          <span className="text-[10px] font-semibold uppercase text-wood-400 bg-cream-200 w-full text-center py-0.5 leading-tight">
                            {calendarMonth}
                          </span>
                          <span className="text-lg font-bold text-wood-800 leading-tight py-0.5">
                            {calendarDay}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {insp.performer_display_name && (
                            <p className="text-xs text-wood-400 leading-tight">
                              da {insp.performer_display_name}
                            </p>
                          )}
                          <p className="text-sm text-wood-800 leading-snug">
                            <span className={insp.queen_seen === 'vista' ? 'text-success-600 font-medium' : insp.queen_seen === 'non_vista' ? 'text-danger-500 font-medium' : 'text-wood-500'}>
                              {queenLabel}
                            </span>
                            {' - '}
                            <span className="text-wood-700">Famiglia {popLabel.toLowerCase()}</span>
                          </p>
                          {insp.notes && (
                            <p className="text-xs text-wood-400 mt-0.5 line-clamp-1">
                              {insp.notes}
                            </p>
                          )}
                          {pathologies.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {pathologies.map((p) => (
                                <span
                                  key={p}
                                  className="text-[10px] bg-danger-100 text-danger-500 px-1.5 py-0.5 rounded-sm font-medium"
                                >
                                  {PATHOLOGY_LABELS[p] ?? p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <ArrowRight />
                      </div>
                    </Link>
                  </SwipeableRow>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg
      width="7"
      height="12"
      viewBox="0 0 7 12"
      fill="none"
      className="text-wood-300 shrink-0"
    >
      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
