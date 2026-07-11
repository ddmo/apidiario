import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { getAuthUser } from '@/lib/auth-guard'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { SuggestionsContent } from '@/features/suggestions/components/suggestions-content'

export const Route = createFileRoute('/apiaries/$apiaryId/suggerimenti')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: SuggerimentiPage,
})

function SuggerimentiPage() {
  const { apiaryId } = Route.useParams()
  const router = useRouter()
  const { data: apiary } = useApiary(apiaryId)

  return (
    <main className="h-dvh flex flex-col bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => router.history.back()}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Suggerimenti {apiary?.name ?? '…'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto">
          <SuggestionsContent apiaryId={apiaryId} />
        </div>
      </div>
    </main>
  )
}
