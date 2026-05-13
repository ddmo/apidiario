import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { HiveForm } from '@/features/hives/components/hive-form'

export const Route = createFileRoute('/hives/$hiveId/edit')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: EditHivePage,
})

function EditHivePage() {
  const navigate = useNavigate()
  const { hiveId } = Route.useParams()
  const { session } = useAuth()

  const { data: hive, isLoading } = useQuery({
    queryKey: ['hive', hiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hives')
        .select('id, identifier, hive_type, bee_race, installed_on, origin_notes, nido_frame_count, notes, apiary_id')
        .eq('id', hiveId)
        .single()
      if (error) throw error
      return data
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })

  if (!session?.user?.id) return null

  if (isLoading) {
    return (
      <div className="flex flex-col h-dvh bg-cream-50 items-center justify-center">
        <div className="text-sm text-wood-400">Caricamento…</div>
      </div>
    )
  }

  if (!hive) return null

  const goToInspections = () => void navigate({ to: '/hives/$hiveId/inspections', params: { hiveId } })

  return (
    <div className="flex flex-col h-dvh bg-cream-50">
      <HiveForm
        apiaryId={hive.apiary_id}
        userId={session.user.id}
        hive={hive}
        onSuccess={goToInspections}
        onCancel={goToInspections}
      />
    </div>
  )
}
