import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { ExpressSettingsContent } from '@/features/settings/components/express-settings-content'

export const Route = createFileRoute('/_auth/impostazioni/ispezione-express')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: () => <ExpressSettingsContent />,
})
