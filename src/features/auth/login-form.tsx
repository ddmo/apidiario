import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n/it'

type Status = 'idle' | 'loading' | 'error' | 'success'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('error')
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? t.auth.invalidCredentials
          : error.message,
      )
    } else {
      await navigate({ to: '/' })
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setStatus('error')
      setErrorMsg(t.auth.emailRequired)
      return
    }
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('success')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-wood-600">{t.auth.resetSent}</p>
        <p className="text-xs text-wood-400">{t.auth.resetSentHint}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <Input
        id="email"
        type="email"
        label={t.auth.emailLabel}
        placeholder={t.auth.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        inputMode="email"
        required
      />
      <Input
        id="password"
        type="password"
        label={t.auth.passwordLabel}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <button
        type="button"
        className="self-end -mt-2 text-xs text-wood-500 underline-offset-2 hover:underline"
        onClick={handleForgotPassword}
      >
        {t.auth.forgotPassword}
      </button>

      {status === 'error' && <p className="text-sm text-danger-500">{errorMsg}</p>}

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={status === 'loading'}
        className="w-full"
      >
        {t.auth.signIn}
      </Button>
    </form>
  )
}
