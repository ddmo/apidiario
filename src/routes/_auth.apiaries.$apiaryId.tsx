import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Box, CloudSun, Plus } from 'lucide-react'
import { SuggestionsButton } from '@/features/suggestions/components/suggestions-button'
import { useApiarySuggestions } from '@/features/suggestions/hooks/use-apiary-suggestions'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { useHivesByApiary, useDeleteHive } from '@/features/hives/hooks/use-hives'
import { HiveCard } from '@/features/hives/components/hive-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/apiaries/$apiaryId')({
  component: ApiaryDetailPage,
})

function ApiaryDetailPage() {
  const { apiaryId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const { showToast } = useToast()
  const { data: apiary } = useApiary(apiaryId)
  const { data: hives = [], isLoading } = useHivesByApiary(apiaryId)
  const { mutate: deleteHive } = useDeleteHive()
  const { data: suggestions } = useApiarySuggestions(apiaryId)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleDelete(hiveId: string) {
    deleteHive(hiveId, {
      onSuccess: () => showToast('Arnia eliminata', 'success'),
      onError: () => showToast('Eliminazione fallita', 'error'),
    })
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => void navigate({ to: '/' })}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-2xl font-bold text-wood-800 tracking-tight truncate flex-1 px-1">
          {apiary?.name ?? '…'}
        </h1>
        <span className="flex items-center gap-0.5">
          {apiary?.latitude != null && apiary?.longitude != null && (
            <Link
              to="/apiaries/$apiaryId/meteo"
              params={{ apiaryId }}
              className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
            >
              <CloudSun size={22} strokeWidth={1.75} />
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
            {hives.map((hive) => (
              <li key={hive.id}>
                <HiveCard hive={hive} onDelete={(id) => setDeleteId(id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Fab
        icon={<Plus size={24} strokeWidth={2} aria-hidden="true" />}
        label={t.apiary.detail.addHive}
        onClick={() => void navigate({ to: '/apiaries/$apiaryId/hives/new', params: { apiaryId } })}
      />

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
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg"
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
