import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Trees, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useApiaries } from '@/features/apiaries/hooks/use-apiaries'
import { ApiaryListItem } from '@/features/apiaries/components/apiary-list-item'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { ShareSheet } from '@/features/apiaries/components/share-sheet'
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
  const { data: apiaries, isLoading, isError } = useApiaries()

  const totalHives = apiaries?.reduce((sum, a) => sum + a.hiveCount, 0) ?? 0

  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-cream-50 border-b border-cream-200 px-4 h-14 flex items-center shrink-0">
        <h1 className="text-2xl font-bold text-wood-800 tracking-tight flex-1">
          {t.apiaries.title}
        </h1>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 px-4 pt-4">
          <div className="flex flex-col gap-2.5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-sm text-danger-500">{t.common.error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && apiaries?.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
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
            {/* Filter placeholder — not functional yet */}
            <span className="text-xs font-medium text-wood-300 cursor-not-allowed select-none">
              {t.apiaries.filter}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-24">
            <div className="flex flex-col gap-2.5">
              {apiaries.map((apiary) => (
                <SwipeableRow
                  key={apiary.id}
                  revealWidth={84}
                  revealContent={
                    <button
                      type="button"
                      onClick={() => setShareTarget({ id: apiary.id, name: apiary.name })}
                      className="flex-1 flex flex-col items-center justify-center gap-1 bg-honey-500 text-white"
                    >
                      <Share2 size={18} strokeWidth={1.75} />
                      <span className="text-[11px] font-semibold leading-none">Condividi</span>
                    </button>
                  }
                >
                  <ApiaryListItem
                    apiary={apiary}
                    onClick={() => void navigate({ to: '/apiaries/$apiaryId', params: { apiaryId: apiary.id } })}
                  />
                </SwipeableRow>
              ))}
            </div>

            {/* Sync indicator */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-wood-400">
              <span className="size-1.5 rounded-full bg-success-500" aria-hidden="true" />
              <span>{t.apiaries.synced}</span>
            </div>
          </div>
        </>
      )}

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
    </div>
  )
}
