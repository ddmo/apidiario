import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-guard'
import { useCreateHarvest } from '@/features/harvests/hooks/use-harvests'
import { useToast } from '@/hooks/use-toast'
import { HarvestForm } from '@/features/harvests/components/harvest-form'
import type { HarvestFormData } from '@/features/harvests/components/harvest-form'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/raccolti/new')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: NewRaccoltoPage,
})

function NewRaccoltoPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const createHarvest = useCreateHarvest()

  async function handleSave(data: HarvestFormData) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) return

    try {
      await createHarvest.mutateAsync({
        apiary_id: data.apiaryId,
        harvested_on: data.harvestedOn,
        honey_type: data.honeyType,
        total_kg: data.totalKg,
        humidity_pct: data.humidityPct,
        batch_code: data.batchCode,
        notes: data.notes,
        recorded_by: session.user.id,
      })
      void navigate({ to: '/raccolti' })
    } catch {
      showToast('Salvataggio fallito', 'error')
    }
  }

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex-1 min-w-0 bg-cream-50">
        <HarvestForm
          title="Nuovo raccolto"
          onSave={handleSave}
          onCancel={() => void navigate({ to: '/raccolti' })}
          isPending={createHarvest.isPending}
        />
      </div>
    </div>
  )
}
