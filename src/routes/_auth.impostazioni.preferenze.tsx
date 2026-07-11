import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthUser } from '@/lib/auth-guard'
import { PreferenzeContent } from '@/features/settings/components/preferenze-content'

export const Route = createFileRoute('/_auth/impostazioni/preferenze')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: PreferencePage,
})

function PreferencePage() {
  return (
    <div className="fixed inset-0 tablet:relative tablet:inset-auto bg-cream-50 text-wood-700 flex flex-col z-10 tablet:z-auto tablet:h-full">
      <PreferenzeContent />
    </div>
  )
}
