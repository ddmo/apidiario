import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useTreatment, useUpdateTreatment } from '@/features/treatments/hooks/use-treatments'
import { TreatmentForm } from '@/features/treatments/components/treatment-form'
import type { TreatmentFormData } from '@/features/treatments/components/treatment-form'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/trattamenti/$treatmentId/edit')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
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

  if (!session?.user?.id) return null
  if (isLoading || !treatment) {
    return (
      <div className="flex flex-col h-dvh bg-cream-50">
        <div className="flex items-center justify-center h-40 text-sm text-wood-400">Caricamento…</div>
      </div>
    )
  }

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
    <div className="flex flex-col h-dvh bg-cream-50">
      <TreatmentForm
        userId={session.user.id}
        treatment={treatment}
        onSave={handleSave}
        onCancel={() => router.history.back()}
        isPending={isPending}
      />
    </div>
  )
}
