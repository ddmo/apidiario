import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useInspectionsByHive } from '@/features/inspections/hooks/use-inspections'
import { PATHOLOGY_LABELS } from '@/features/inspections/constants'
import { EmptyState } from '@/components/ui/empty-state'
import { ClipboardList } from 'lucide-react'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/hives/$hiveId/inspections')({
  component: InspectionListPage,
})

function InspectionListPage() {
  const { hiveId } = Route.useParams()
  const navigate = useNavigate()

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
    <div className="flex flex-col min-h-full bg-cream-50">
      <header className="bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => void navigate({ to: -1 as never })}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0 px-1">
          <p className="text-xs text-wood-400 leading-none mb-0.5">
            {t.inspection.list.title}
          </p>
          <h1 className="text-base font-semibold text-wood-800 truncate leading-tight">
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
              const isExpress = insp.brood_frame_count === null
              const date = new Date(insp.performed_at)
              const day = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
              const year = date.getFullYear()
              const pathologies = insp.pathologies ?? []

              return (
                <li key={insp.id}>
                  <Link
                    to="/ispezione/$inspectionId"
                    params={{ inspectionId: insp.id }}
                    className="block bg-cream-100 border border-cream-200 rounded-xl px-4 py-3 active:bg-cream-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-wood-800">
                            {day} {year}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                              isExpress
                                ? 'bg-honey-100 text-honey-700'
                                : 'bg-cream-200 text-wood-600'
                            }`}
                          >
                            {isExpress
                              ? t.inspection.mode.express
                              : t.inspection.mode.standard}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <QueenChip value={insp.queen_seen} />
                          {insp.population && (
                            <PopChip value={insp.population} />
                          )}
                          {insp.melari_count > 0 && (
                            <span className="text-xs text-wood-500">
                              {insp.melari_count} melar{insp.melari_count === 1 ? 'io' : 'i'}
                            </span>
                          )}
                        </div>
                        {pathologies.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
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
                        {insp.notes && (
                          <p className="text-xs text-wood-400 mt-1.5 line-clamp-1">
                            {insp.notes}
                          </p>
                        )}
                      </div>
                      <ArrowRight />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function QueenChip({ value }: { value: string }) {
  const map: Record<string, { label: string; color: string }> = {
    vista: { label: 'Regina vista', color: 'text-success-500' },
    non_vista: { label: 'Non vista', color: 'text-danger-500' },
    non_cercata: { label: 'Non cercata', color: 'text-wood-400' },
  }
  const item = map[value] ?? { label: value, color: 'text-wood-400' }
  return <span className={`text-xs font-medium ${item.color}`}>{item.label}</span>
}

function PopChip({ value }: { value: string }) {
  const map: Record<string, string> = {
    debole: 'bg-danger-100 text-danger-500',
    media: 'bg-cream-200 text-wood-600',
    forte: 'bg-[#e8f5e8] text-[#4A6E3C]',
  }
  const label = (t.inspection.population as Record<string, string>)[value] ?? value
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${map[value] ?? 'bg-cream-200 text-wood-600'}`}>
      {label}
    </span>
  )
}

function ArrowRight() {
  return (
    <svg
      width="7"
      height="12"
      viewBox="0 0 7 12"
      fill="none"
      className="text-wood-300 mt-0.5 shrink-0"
    >
      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
