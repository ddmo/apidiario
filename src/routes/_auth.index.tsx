import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Trees, Share2, Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useApiaries, useDeleteApiary } from '@/features/apiaries/hooks/use-apiaries'
import { ApiaryListItem } from '@/features/apiaries/components/apiary-list-item'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { ShareSheet } from '@/features/apiaries/components/share-sheet'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/')({
  component: HomePage,
})

function SkeletonCard() {
  return (
    <div className="bg-cream-100 border border-cream-200 rounded-lg p-3 flex items-center gap-3 shadow-xs animate-pulse">
      <div className="size-16 shrink-0 rounded-md bg-cream-200" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-cream-200 rounded w-2/3" />
        <div className="h-3 bg-cream-200 rounded w-1/2" />
      </div>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: apiaries, isLoading, isError } = useApiaries()
  const { mutate: deleteApiary } = useDeleteApiary()

  const totalHives = apiaries?.reduce((sum, a) => sum + a.hiveCount, 0) ?? 0

  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="flex flex-col h-full bg-cream-50">
      {/* Header */}
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-4 h-14 flex items-center">
        <h1 className="text-2xl font-bold text-wood-800 tracking-tight flex-1">
          {t.apiaries.title}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Loading */}
        {isLoading && (
          <div className="px-4 pt-4">
            <div className="flex flex-col gap-2.5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center justify-center px-4 py-20">
            <p className="text-sm text-danger-500">{t.common.error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && apiaries?.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <EmptyState
              icon={<Trees size={64} strokeWidth={1.5} />}
              title={t.apiaries.empty.title}
              description={t.apiaries.empty.description}
              action={{
                label: t.apiaries.empty.cta,
                onClick: () => void navigate({ to: '/apiaries/new' }),
              }}
            />
          </div>
        )}

        {/* Populated list */}
        {!isLoading && !isError && apiaries && apiaries.length > 0 && (
          <>
            {/* Summary bar */}
            <div className="px-4 pt-4 pb-2 flex items-baseline justify-between">
              <p className="text-sm text-wood-500">
                <span className="font-semibold text-wood-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {t.apiaries.summary(apiaries.length, totalHives)}
                </span>
              </p>
            </div>

            <div className="px-4 pb-24">
              <div className="flex flex-col gap-2.5">
                {apiaries.map((apiary) => (
                  <SwipeableRow
                    key={apiary.id}
                    revealWidth={240}
                    revealContent={
                      <div className="flex-1 flex items-stretch">
                        <button
                          type="button"
                          onClick={() => setShareTarget({ id: apiary.id, name: apiary.name })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-honey-500 text-white"
                        >
                          <Share2 size={18} strokeWidth={1.75} />
                          <span className="text-[11px] font-semibold leading-none">Condividi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void navigate({ to: '/apiaries/$apiaryId/edit', params: { apiaryId: apiary.id } })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#5B8FA0] text-white"
                        >
                          <Pencil size={18} strokeWidth={1.75} />
                          <span className="text-[11px] font-semibold leading-none">Modifica</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: apiary.id, name: apiary.name })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-danger-500 text-white"
                        >
                          <Trash2 size={18} strokeWidth={1.75} />
                          <span className="text-[11px] font-semibold leading-none">Elimina</span>
                        </button>
                      </div>
                    }
                  >
                    <ApiaryListItem
                      apiary={apiary}
                      onClick={() => void navigate({ to: '/apiaries/$apiaryId', params: { apiaryId: apiary.id } })}
                    />
                  </SwipeableRow>
                ))}
              </div>

            </div>
          </>
        )}
      </div>

      <Fab
        icon={<Plus size={24} strokeWidth={2} aria-hidden="true" />}
        label={t.apiaries.createCta}
        onClick={() => void navigate({ to: '/apiaries/new' })}
      />

      <ShareSheet
        open={shareTarget !== null}
        apiaryId={shareTarget?.id ?? ''}
        apiaryName={shareTarget?.name ?? ''}
        onClose={() => setShareTarget(null)}
        onShared={() => setShareTarget(null)}
      />

      {/* Delete apiary confirmation */}
      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 z-30 bg-wood-900/40"
            onClick={() => setDeleteTarget(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Elimina apiario"
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">Elimina apiario</h2>
              <p className="text-sm text-wood-500 leading-relaxed">
                Eliminare <strong>{deleteTarget.name}</strong>? Tutte le arnie e ispezioni associate verranno rimosse. L&rsquo;operazione non pu&ograve; essere annullata.
              </p>
            </div>
            <div className="px-4 flex flex-col gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  deleteApiary(deleteTarget.id, {
                    onSuccess: () => showToast('Apiario eliminato', 'success'),
                    onError: () => showToast('Eliminazione fallita', 'error'),
                  })
                  setDeleteTarget(null)
                }}
                className="w-full h-13 flex items-center justify-center gap-2 rounded-md font-medium bg-danger-500 text-cream-50 hover:bg-danger-500/90 transition-colors"
              >
                Elimina
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
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
