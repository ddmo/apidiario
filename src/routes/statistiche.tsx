import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { StatisticheContent } from '@/features/reports/components/statistiche-content'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/statistiche')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: StatistichePage,
})

function StatistichePage() {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col bg-cream-50">
        <StatisticheContent />
      </main>
    </div>
  )
}
