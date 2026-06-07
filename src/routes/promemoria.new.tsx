import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useCreateReminder } from '@/features/reminders/hooks/use-reminders'
import { ReminderForm } from '@/features/reminders/components/reminder-form'
import { useToast } from '@/hooks/use-toast'
import type { ReminderFormData } from '@/features/reminders/types'

export const Route = createFileRoute('/promemoria/new')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: NewReminderPage,
})

function NewReminderPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const createReminder = useCreateReminder()

  async function handleSave(data: ReminderFormData) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      showToast('Sessione scaduta, riaccedi.', 'error')
      return
    }

    createReminder.mutate(
      {
        user_id: session.user.id,
        title: data.title,
        description: data.description || null,
        due_at: data.due_at,
        recurrence: data.recurrence,
        scope: data.scope,
        apiary_id: data.apiary_id || null,
        hive_id: data.hive_id || null,
      },
      {
        onSuccess: () => {
          void navigate({ to: '/promemoria' })
        },
        onError: () => {
          showToast('Salvataggio fallito', 'error')
        },
      },
    )
  }

  function handleCancel() {
    void navigate({ to: '/promemoria' })
  }

  return (
    <div className="fixed inset-0 z-20 bg-cream-50">
      <ReminderForm
        title="Nuovo promemoria"
        onSave={handleSave}
        onCancel={handleCancel}
        isPending={createReminder.isPending}
      />
    </div>
  )
}
