import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/apiaries/$apiaryId')({
  component: ApiaryDetailPage,
})

function ApiaryDetailPage() {
  const { apiaryId } = Route.useParams()
  const navigate = useNavigate()

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
          Apiario
        </h1>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-wood-400">{t.apiary.detail.comingSoon}</p>
          <p className="text-xs text-wood-300 mt-1 font-mono">{apiaryId}</p>
        </div>
      </div>
    </div>
  )
}
