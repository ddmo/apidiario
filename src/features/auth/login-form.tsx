import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n/it'

type Mode = 'login' | 'register'
type Status = 'idle' | 'loading' | 'error'

export function LoginForm() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setPassword('')
    setPasswordConfirm('')
    setStatus('idle')
    setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    if (mode === 'register') {
      if (password !== passwordConfirm) {
        setStatus('error')
        setErrorMsg(t.auth.passwordMismatch)
        return
      }
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setStatus('error')
        setErrorMsg(error.message)
      } else {
        await navigate({ to: '/' })
      }
      return
    }

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        required
        minLength={6}
      />
      {mode === 'register' && (
        <Input
          id="password-confirm"
          type="password"
          label={t.auth.passwordConfirmLabel}
          placeholder="••••••••"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
      )}

      {status === 'error' && <p className="text-sm text-danger-500">{errorMsg}</p>}

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={status === 'loading'}
        className="w-full"
      >
        {mode === 'login' ? t.auth.signIn : t.auth.signUp}
      </Button>

      <button
        type="button"
        className="text-sm text-wood-500 underline-offset-2 hover:underline self-center"
        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
      </button>
    </form>
  )
}
