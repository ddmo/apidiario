import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { ApiaryForm } from '@/features/apiaries/components/apiary-form'

export const Route = createFileRoute('/apiaries/new')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: NewApiaryPage,
})

function NewApiaryPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const { session } = useAuth()

  if (!session?.user?.id) return null

  return (
    <div className="flex flex-col h-dvh bg-cream-50">
      <ApiaryForm
        userId={session.user.id}
        onSuccess={() => void navigate({ to: '/' })}
        onCancel={() => router.history.back()}
      />
    </div>
  )
}
