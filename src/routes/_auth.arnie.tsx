import { createFileRoute } from '@tanstack/react-router'
import { useAllHives } from '@/features/hives/hooks/use-hives'
import { HiveCard } from '@/features/hives/components/hive-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Box } from 'lucide-react'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/arnie')({
  component: ArniePage,
})

function ArniePage() {
  const { data: hives = [], isLoading } = useAllHives()

  return (
    <div className="flex flex-col min-h-full bg-cream-50">
      <header className="bg-cream-50 border-b border-cream-200 px-4 h-14 flex items-center shrink-0">
        <h1 className="text-base font-semibold text-wood-800">{t.nav.arnie}</h1>
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
              title={t.hive.allHives.emptyTitle}
              description={t.hive.allHives.emptyDescription}
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
    </div>
  )
}
