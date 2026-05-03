import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/home')({
  component: HomePage,
})

function HomePage() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <span className="size-5 rounded-full border-2 border-honey-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-semibold text-wood-800">
        {t.home.greeting(profile?.display_name ?? '…')}
      </h1>
      <p className="mt-1 text-sm text-wood-500">{t.home.subtitle}</p>
    </div>
  )
}
