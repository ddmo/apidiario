import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { HiveForm } from '@/features/hives/components/hive-form'

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
    <div className="flex flex-col h-dvh bg-cream-50">
      <HiveForm
        apiaryId={apiaryId}
        userId={session.user.id}
        onSuccess={goToApiary}
        onCancel={goToApiary}
      />
    </div>
  )
}
