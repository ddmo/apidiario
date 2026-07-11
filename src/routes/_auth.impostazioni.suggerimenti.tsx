import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { SuggestionSettingsContent } from '@/features/settings/components/suggestion-settings-content'

export const Route = createFileRoute('/_auth/impostazioni/suggerimenti')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: () => <SuggestionSettingsContent />,
})
