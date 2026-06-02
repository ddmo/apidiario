import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useReminder, useUpdateReminder } from '@/features/reminders/hooks/use-reminders'
import { ReminderForm } from '@/features/reminders/components/reminder-form'
import { useToast } from '@/hooks/use-toast'
import type { ReminderFormData } from '@/features/reminders/types'

export const Route = createFileRoute('/promemoria/$reminderId/edit')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: EditReminderPage,
})

function EditReminderPage() {
  const { reminderId } = Route.useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: reminder, isLoading } = useReminder(reminderId)
  const updateReminder = useUpdateReminder()

  async function handleSave(data: ReminderFormData) {
    if (!reminder) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      showToast('Sessione scaduta, riaccedi.', 'error')
      return
    }

    updateReminder.mutate(
      {
        id: reminder.id,
        title: data.title,
        description: data.description || null,
        due_at: data.due_at,
        recurrence: data.recurrence,
        scope: data.scope,
        apiary_id: data.apiary_id || null,
        hive_id: data.hive_id || null,
        push_enabled: reminder.push_enabled,
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

  if (isLoading || !reminder) {
    return (
      <div className="fixed inset-0 z-20 bg-cream-50 flex items-center justify-center">
        <p className="text-sm text-wood-400">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-20 bg-cream-50">
      <ReminderForm
        title="Modifica promemoria"
        initialData={{
          title: reminder.title,
          description: reminder.description ?? '',
          due_at: reminder.due_at,
          recurrence: reminder.recurrence,
          scope: reminder.scope,
          apiary_id: reminder.apiary_id ?? '',
          hive_id: reminder.hive_id ?? '',
        }}
        onSave={handleSave}
        onCancel={handleCancel}
        isPending={updateReminder.isPending}
      />
    </div>
  )
}
