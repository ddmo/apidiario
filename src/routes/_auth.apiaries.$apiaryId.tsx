import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/apiaries/$apiaryId')({
  component: ApiaryDetailPage,
})

function ApiaryDetailPage() {
  const { apiaryId } = Route.useParams()
  const navigate = useNavigate()
  const { data: apiary } = useApiary(apiaryId)

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

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-sm text-wood-400">{t.apiary.detail.comingSoon}</p>
        <Link to="/apiaries/$apiaryId/hives/new" params={{ apiaryId }}>
          <Button variant="primary" size="md">
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            {t.apiary.detail.addHive}
          </Button>
        </Link>
      </div>
    </div>
  )
}
