import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { useHarvest, useUpdateHarvest } from '@/features/harvests/hooks/use-harvests'
import { useToast } from '@/hooks/use-toast'
import { HarvestForm } from '@/features/harvests/components/harvest-form'
import type { HarvestFormData } from '@/features/harvests/components/harvest-form'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/raccolti/$harvestId/edit')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: EditRaccoltoPage,
})

function EditRaccoltoPage() {
  const { harvestId } = Route.useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: harvest, isLoading } = useHarvest(harvestId)
  const updateHarvest = useUpdateHarvest()

  async function handleSave(data: HarvestFormData) {
    try {
      await updateHarvest.mutateAsync({
        id: harvestId,
        apiary_id: data.apiaryId,
        harvested_on: data.harvestedOn,
        honey_type: data.honeyType,
        total_kg: data.totalKg,
        humidity_pct: data.humidityPct,
        batch_code: data.batchCode,
        notes: data.notes,
      })
      void navigate({ to: '/raccolti' })
    } catch {
      showToast('Salvataggio fallito', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-6">
          <p className="text-sm text-wood-400">Caricamento…</p>
        </main>
      </div>
    )
  }

  if (!harvest) return null

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex-1 min-w-0 bg-cream-50">
        <HarvestForm
          title="Modifica raccolto"
          initialData={{
            apiaryId: harvest.apiary_id,
            harvestedOn: harvest.harvested_on,
            honeyType: harvest.honey_type,
            totalKg: String(harvest.total_kg),
            humidityPct: harvest.humidity_pct != null ? String(harvest.humidity_pct) : '',
            batchCode: harvest.batch_code ?? '',
            notes: harvest.notes ?? '',
          }}
          onSave={handleSave}
          onCancel={() => void navigate({ to: '/raccolti' })}
          isPending={updateHarvest.isPending}
        />
      </div>
    </div>
  )
}
