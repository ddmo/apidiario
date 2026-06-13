import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { LoginForm } from '@/features/auth/login-form'
import { BeeAnimation } from '@/components/animations/BeeAnimation'

;(window as unknown as { __APP_VERSION__: string }).__APP_VERSION__ = __APP_VERSION__

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 pt-12 pb-4">
      <div className="w-full max-w-sm">
        <img
          src="/icons/icon.svg"
          alt="Apidiario"
          className="mx-auto mb-6 size-28"
        />
        <h1 className="font-display text-3xl font-medium text-wood-800 mb-1 tracking-tight">
          Apidiario
        </h1>
        <p className="text-sm text-wood-500">Gestisci i tuoi apiari, ovunque tu sia.</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 min-h-[180px]">
        <BeeAnimation className="w-full max-w-sm" />
      </div>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  )
}
