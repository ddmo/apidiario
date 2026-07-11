import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { ApiaryForm } from '@/features/apiaries/components/apiary-form'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/apiaries/$apiaryId/edit')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: EditApiaryPage,
})

function EditApiaryPage() {
  const { apiaryId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const { session } = useAuth()
  const { data: apiary, isLoading } = useApiary(apiaryId)

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-cream-50">
        {!session?.user?.id || isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-wood-400">
            Caricamento…
          </div>
        ) : (
          <ApiaryForm
            userId={session.user.id}
            initialData={apiary ?? null}
            onSuccess={() => void navigate({ to: '/' })}
            onCancel={() => router.history.back()}
          />
        )}
      </div>
    </div>
  )
}
