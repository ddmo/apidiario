import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { HiveForm } from '@/features/hives/components/hive-form'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/apiaries/$apiaryId/hives/new')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: NewHivePage,
})

function NewHivePage() {
  const navigate = useNavigate()
  const { apiaryId } = Route.useParams()
  const { session } = useAuth()

  if (!session?.user?.id) return null

  const goToApiary = () => void navigate({ to: '/apiaries/$apiaryId', params: { apiaryId } })

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-cream-50">
        <HiveForm
          apiaryId={apiaryId}
          userId={session.user.id}
          onSuccess={goToApiary}
          onCancel={goToApiary}
        />
      </div>
    </div>
  )
}
