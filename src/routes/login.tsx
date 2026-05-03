import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { LoginForm } from '@/features/auth/login-form'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      throw redirect({ to: '/home' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-medium text-wood-800 mb-1 tracking-tight">
          Apidiario
        </h1>
        <p className="text-sm text-wood-500 mb-8">Gestisci i tuoi apiari, ovunque tu sia.</p>
        <LoginForm />
      </div>
    </main>
  )
}
