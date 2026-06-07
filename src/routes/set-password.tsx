import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { t } from '@/i18n/it'

type Status = 'idle' | 'loading' | 'error' | 'success'

export const Route = createFileRoute('/set-password')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: SetPasswordPage,
})

function SetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    if (password !== confirm) {
      setStatus('error')
      setErrorMsg(t.auth.passwordMismatch)
      return
    }

    if (password.length < 6) {
      setStatus('error')
      setErrorMsg(t.auth.passwordTooShort)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('success')
      setTimeout(() => navigate({ to: '/' }), 1500)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-medium text-wood-800 mb-1 tracking-tight">
          {t.auth.setPassword}
        </h1>
        <p className="text-sm text-wood-500 mb-8">
          {status === 'success'
            ? t.auth.passwordSaved
            : t.auth.setPasswordDescription}
        </p>

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="password"
              type="password"
              label="Nuova password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
            <Input
              id="confirm"
              type="password"
              label="Conferma password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
            {status === 'error' && (
              <p className="text-sm text-danger-500">{errorMsg}</p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={status === 'loading'}
              className="w-full"
            >
              Salva password
            </Button>
          </form>
        )}

        {status === 'success' && (
          <p className="text-sm text-wood-400 text-center">
            Reindirizzamento in corso&hellip;
          </p>
        )}
      </div>
    </main>
  )
}
