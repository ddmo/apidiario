import { createFileRoute, redirect, useNavigate, useSearch } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { useCreateTreatment } from '@/features/treatments/hooks/use-treatments'
import { TreatmentForm } from '@/features/treatments/components/treatment-form'
import type { TreatmentFormData } from '@/features/treatments/components/treatment-form'
import { useToast } from '@/hooks/use-toast'

interface SearchParams {
  apiaryId?: string
}

export const Route = createFileRoute('/trattamenti/new')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  validateSearch: (params: Record<string, unknown>): SearchParams => ({
    apiaryId: typeof params.apiaryId === 'string' ? params.apiaryId : undefined,
  }),
  component: NewTreatmentPage,
})

function NewTreatmentPage() {
  const navigate = useNavigate()
  const { apiaryId } = useSearch({ from: '/trattamenti/new' })
  const { session } = useAuth()
  const { mutate: createTreatment, isPending } = useCreateTreatment()
  const { showToast } = useToast()

  if (!session?.user?.id) return null

  function handleSave(data: TreatmentFormData) {
    createTreatment(
      { ...data, userId: session!.user.id },
      {
        onSuccess: () => {
          showToast('Trattamento salvato', 'success')
          void navigate({ to: '/trattamenti' })
        },
        onError: () => showToast('Salvataggio fallito. Riprova.', 'error'),
      },
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-cream-50">
      <TreatmentForm
        userId={session.user.id}
        prefillApiaryId={apiaryId ?? null}
        onSave={handleSave}
        onCancel={() => void navigate({ to: '/trattamenti' })}
        isPending={isPending}
      />
    </div>
  )
}
