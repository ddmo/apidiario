import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { PrevisioniContent } from '@/features/phenology/components/previsioni-content'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/previsioni')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: PrevisioniPage,
})

function PrevisioniPage() {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col bg-cream-50">
        <PrevisioniContent />
      </main>
    </div>
  )
}
