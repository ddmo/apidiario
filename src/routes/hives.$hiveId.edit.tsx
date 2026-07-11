import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { EditHivePanel } from '@/features/hives/components/edit-hive-panel'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/hives/$hiveId/edit')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: EditHivePage,
})

function EditHivePage() {
  const navigate = useNavigate()
  const { hiveId } = Route.useParams()

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-cream-50">
        <EditHivePanel
          hiveId={hiveId}
          onSuccess={() => void navigate({ to: '/' })}
          onCancel={() => void navigate({ to: '/' })}
        />
      </div>
    </div>
  )
}
