import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { ApiaryForm } from '@/features/apiaries/components/apiary-form'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/apiaries/new')({
  beforeLoad: async () => {
    const user = await getAuthUser()
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
    <>
      <Sidebar />
      <div className="fixed inset-0 z-40 bg-cream-50 tablet:bg-wood-900/28 tablet:backdrop-blur-[1.5px] tablet:left-[72px] lg:left-[232px] tablet:flex tablet:items-center tablet:justify-center tablet:p-6">
        <div className="h-dvh tablet:h-auto tablet:max-h-[90vh] w-full tablet:max-w-[520px] xl:max-w-[680px] tablet:rounded-2xl tablet:shadow-lg bg-cream-50 flex flex-col tablet:overflow-hidden">
          <ApiaryForm
            userId={session.user.id}
            onSuccess={() => void navigate({ to: '/' })}
            onCancel={() => router.history.back()}
          />
        </div>
      </div>
    </>
  )
}
