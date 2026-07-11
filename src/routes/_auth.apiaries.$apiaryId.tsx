import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Box, CloudSun, LayoutList, PanelLeft, Plus, ClipboardList } from 'lucide-react'
import { SuggestionsButton } from '@/features/suggestions/components/suggestions-button'
import { useApiarySuggestions } from '@/features/suggestions/hooks/use-apiary-suggestions'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { useHivesByApiary, useDeleteHive } from '@/features/hives/hooks/use-hives'
import { useInspectionsByHive } from '@/features/inspections/hooks/use-inspections'
import { HiveCard } from '@/features/hives/components/hive-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { useToast } from '@/hooks/use-toast'
import { useIsTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { PATHOLOGY_LABELS } from '@/features/inspections/constants'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/apiaries/$apiaryId')({
  component: ApiaryDetailPage,
})

/** Pannello destro (tablet/desktop): dettaglio arnia selezionata + storico ispezioni. */
function HiveDetailPanel({ hiveId, apiaryId }: { hiveId: string; apiaryId: string }) {
  const { data: hives = [] } = useHivesByApiary(apiaryId)
  const hive = hives.find((h) => h.id === hiveId)
  const { data: inspections = [], isLoading } = useInspectionsByHive(hiveId)

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <header className="shrink-0 border-b border-cream-200 px-5 h-14 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-wood-800 truncate">{hive?.identifier ?? '…'}</h2>
        <Link
          to="/inspections/$hiveId/new"
          params={{ hiveId }}
          className="text-xs font-medium text-cream-50 bg-honey-500 hover:bg-honey-600 shrink-0 px-3 py-2 rounded-md transition-colors"
        >
          Nuova ispezione
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto p-5">
        {hive && (
          <div className="max-w-[280px] mb-5">
            <HiveCard hive={hive} showSchematic />
          </div>
        )}

        <h3 className="text-xs font-semibold text-wood-400 uppercase tracking-wide mb-2">Storico ispezioni</h3>
        {isLoading ? (
          <p className="text-sm text-wood-400">{t.common.loading}</p>
        ) : inspections.length === 0 ? (
          <EmptyState icon={<ClipboardList size={40} strokeWidth={1.25} />} title={t.inspection.list.empty} description={t.inspection.list.emptyDescription} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {inspections.map((insp) => {
              const date = new Date(insp.performed_at)
              const queenLabel = `Regina ${(t.inspection.queenSeen as Record<string, string>)[insp.queen_seen ?? ''] ?? insp.queen_seen ?? 'non cercata'}`
              const popLabel = (t.inspection.population as Record<string, string>)[insp.population ?? ''] ?? insp.population ?? 'Media'
              return (
                <Link
                  key={insp.id}
                  to="/hives/$hiveId/inspections/$inspectionId"
                  params={{ hiveId, inspectionId: insp.id }}
                  className="block bg-cream-100 border border-cream-200 rounded-lg px-4 py-3 hover:bg-cream-200/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-wood-700">
                      {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {insp.performer_display_name && (
                      <span className="text-[11px] text-wood-400">{insp.performer_display_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-wood-700">
                    <span className={insp.queen_seen === 'vista' ? 'text-success-600 font-medium' : insp.queen_seen === 'non_vista' ? 'text-danger-500 font-medium' : 'text-wood-500'}>
                      {queenLabel}
                    </span>
                    {' · '}Famiglia {popLabel.toLowerCase()}
                  </p>
                  {(insp.pathologies?.length ?? 0) > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {insp.pathologies!.map((p) => (
                        <span key={p} className="text-[10px] bg-danger-100 text-danger-500 px-1.5 py-0.5 rounded-sm font-medium">
                          {PATHOLOGY_LABELS[p] ?? p}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ApiaryDetailPage() {
  const { apiaryId } = Route.useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: apiary } = useApiary(apiaryId)
  const { data: hives = [], isLoading } = useHivesByApiary(apiaryId)
  const { mutate: deleteHive } = useDeleteHive()
  const { data: suggestions } = useApiarySuggestions(apiaryId)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showSchematic, setShowSchematic] = useState(() => {
    const saved = localStorage.getItem('hiveCardView')
    return saved ? saved === 'schematic' : true
  })
  const isTablet = useIsTablet()
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null)

  function handleDelete(hiveId: string) {
    deleteHive(hiveId, {
      onSuccess: () => showToast('Arnia eliminata', 'success'),
      onError: () => showToast('Eliminazione fallita', 'error'),
    })
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col tablet:flex-row h-full bg-cream-50">
      <div className="flex flex-col tablet:w-[360px] tablet:shrink-0 tablet:h-full tablet:border-r tablet:border-cream-200 min-h-0">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => void navigate({ to: '/' })}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight truncate flex-1 min-w-0 px-1">
          {apiary?.name ?? '…'}
        </h1>
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={showSchematic ? 'Vista compatta' : 'Vista schematica'}
            onClick={() => setShowSchematic((v) => {
              const next = !v
              localStorage.setItem('hiveCardView', next ? 'schematic' : 'compact')
              return next
            })}
            className="size-9 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            {showSchematic ? <LayoutList size={18} strokeWidth={1.75} /> : <PanelLeft size={18} strokeWidth={1.75} />}
          </button>
          {apiary?.latitude != null && apiary?.longitude != null && (
            <Link
              to="/apiaries/$apiaryId/meteo"
              params={{ apiaryId }}
              className="size-9 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
            >
              <CloudSun size={18} strokeWidth={1.75} />
            </Link>
          )}
          <SuggestionsButton
            apiaryId={apiaryId}
            criticalCount={suggestions?.reduce((acc, hs) => acc + hs.suggestions.filter((s) => s.severity === 'critical').length, 0)}
          />
        </span>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-wood-400">
            {t.common.loading}
          </div>
        ) : hives.length === 0 ? (
          <div className="px-4 pt-12">
            <EmptyState
              icon={<Box size={40} strokeWidth={1.25} />}
              title={t.apiary.detail.emptyTitle}
              description={t.apiary.detail.emptyDescription}
            />
          </div>
        ) : (
          <ul className="px-4 pt-4 flex flex-col gap-3">
            {hives.map((hive) => {
              const hiveSuggestions = suggestions?.find((s) => s.hive.id === hive.id)
              const feverSugg = hiveSuggestions?.suggestions.find((s) => s.id === 'swarming-fever')
              const feverSeverity = feverSugg?.severity
              return (
                <li
                  key={hive.id}
                  onClick={() => isTablet && setSelectedHiveId(hive.id)}
                  className={cn(isTablet && 'cursor-pointer tablet:rounded-lg', selectedHiveId === hive.id && 'tablet:ring-2 tablet:ring-honey-500 tablet:rounded-lg')}
                >
                  <HiveCard hive={hive} showSchematic={isTablet ? false : showSchematic} onDelete={(id) => setDeleteId(id)} swarmingFeverSeverity={feverSeverity} />
                </li>
              )
            })}
          </ul>
        )}
        {hives.length > 0 && (
          <button
            type="button"
            onClick={() => void navigate({ to: '/apiaries/$apiaryId/hives/new', params: { apiaryId } })}
            className="hidden tablet:flex mx-4 mt-3 h-11 items-center justify-center gap-2 rounded-md font-medium bg-honey-500 text-cream-50 hover:bg-honey-600 transition-colors"
          >
            <Plus size={18} strokeWidth={2} />
            Nuova arnia
          </button>
        )}
      </div>
      </div>

      {/* Pannello destro (tablet/desktop): dettaglio arnia selezionata */}
      <div className="hidden tablet:flex tablet:flex-1 tablet:min-w-0 bg-cream-50">
        {selectedHiveId ? (
          <HiveDetailPanel hiveId={selectedHiveId} apiaryId={apiaryId} />
        ) : (
          <div className="flex-1 flex items-center justify-center px-8">
            <p className="text-sm text-wood-400 text-center">Seleziona un&rsquo;arnia per vedere il dettaglio</p>
          </div>
        )}
      </div>

      <div className="tablet:hidden">
        <Fab
          icon={<Plus size={24} strokeWidth={2} aria-hidden="true" />}
          label={t.apiary.detail.addHive}
          onClick={() => void navigate({ to: '/apiaries/$apiaryId/hives/new', params: { apiaryId } })}
        />
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <>
          <div
            className="fixed inset-0 z-30 bg-wood-900/40"
            onClick={() => setDeleteId(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Elimina arnia"
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg animate-slide-up"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">Elimina arnia</h2>
              <p className="text-sm text-wood-500 leading-relaxed">
                Eliminare questa arnia? Tutte le ispezioni associate verranno rimosse. L&rsquo;operazione non pu&ograve; essere annullata.
              </p>
            </div>
            <div className="px-4 flex flex-col gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="w-full h-13 flex items-center justify-center gap-2 rounded-md font-medium bg-danger-500 text-cream-50 hover:bg-danger-500/90 transition-colors"
              >
                Elimina
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="w-full h-11 flex items-center justify-center rounded-md font-medium bg-transparent text-wood-700 hover:bg-cream-100 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
