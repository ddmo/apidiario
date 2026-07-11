import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { useTreatment, useUpdateTreatment } from '@/features/treatments/hooks/use-treatments'
import { TreatmentForm } from '@/features/treatments/components/treatment-form'
import type { TreatmentFormData } from '@/features/treatments/components/treatment-form'
import { useToast } from '@/hooks/use-toast'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/trattamenti/$treatmentId/edit')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: EditTreatmentPage,
})

function EditTreatmentPage() {
  const { treatmentId } = Route.useParams()
  const { session } = useAuth()
  const { data: treatment, isLoading } = useTreatment(treatmentId)
  const { mutate: updateTreatment, isPending } = useUpdateTreatment()
  const { showToast } = useToast()
  const router = useRouter()

  if (!session?.user?.id || isLoading) {
    return (
      <div className="flex h-dvh">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-cream-50 items-center justify-center">
          <div className="text-sm text-wood-400">Caricamento…</div>
        </div>
      </div>
    )
  }
  if (!treatment) return null

  function handleSave(data: TreatmentFormData) {
    updateTreatment(
      { ...data, treatmentId },
      {
        onSuccess: () => {
          showToast('Trattamento aggiornato', 'success')
          router.history.back()
        },
        onError: () => showToast('Salvataggio fallito. Riprova.', 'error'),
      },
    )
  }

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-cream-50">
        <TreatmentForm
          userId={session.user.id}
          treatment={treatment}
          onSave={handleSave}
          onCancel={() => router.history.back()}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
