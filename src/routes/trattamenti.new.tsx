import { createFileRoute, redirect, useNavigate, useSearch } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { useCreateTreatment } from '@/features/treatments/hooks/use-treatments'
import { TreatmentForm } from '@/features/treatments/components/treatment-form'
import type { TreatmentFormData } from '@/features/treatments/components/treatment-form'
import { useToast } from '@/hooks/use-toast'
import { Sidebar } from '@/components/layout/sidebar'

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
    <>
      <Sidebar />
      <div className="fixed inset-0 z-40 bg-cream-50 tablet:bg-wood-900/28 tablet:backdrop-blur-[1.5px] tablet:left-[72px] lg:left-[232px] tablet:flex tablet:items-center tablet:justify-center tablet:p-6">
        <div className="h-dvh tablet:h-auto tablet:max-h-[90vh] w-full tablet:max-w-[520px] xl:max-w-[680px] tablet:rounded-2xl tablet:shadow-lg bg-cream-50 flex flex-col tablet:overflow-hidden">
          <TreatmentForm
            userId={session.user.id}
            prefillApiaryId={apiaryId ?? null}
            onSave={handleSave}
            onCancel={() => void navigate({ to: '/trattamenti' })}
            isPending={isPending}
          />
        </div>
      </div>
    </>
  )
}
