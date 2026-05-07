import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Box, Plus } from 'lucide-react'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { useHivesByApiary } from '@/features/hives/hooks/use-hives'
import { HiveCard } from '@/features/hives/components/hive-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/apiaries/$apiaryId')({
  component: ApiaryDetailPage,
})

function ApiaryDetailPage() {
  const { apiaryId } = Route.useParams()
  const navigate = useNavigate()
  const { data: apiary } = useApiary(apiaryId)
  const { data: hives = [], isLoading } = useHivesByApiary(apiaryId)

  return (
    <div className="flex flex-col min-h-full bg-cream-50">
      <header className="bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => void navigate({ to: '/' })}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-base font-semibold text-wood-800 truncate flex-1 px-1">
          {apiary?.name ?? '…'}
        </h1>
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
                <HiveCard hive={hive} />
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
    </div>
  )
}
