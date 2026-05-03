import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n/it'

type Step = 'email' | 'otp'
type Status = 'idle' | 'loading' | 'error'

export function LoginForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('idle')
      setStep('otp')
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp) return
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      await navigate({ to: '/home' })
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
        <div className="rounded-lg bg-success-100 p-4 text-sm text-wood-700">
          <p className="font-medium">{t.auth.magicLinkSent}</p>
          <p className="mt-1 text-wood-500">{t.auth.checkEmail}</p>
        </div>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          label={t.auth.otpLabel}
          placeholder={t.auth.otpPlaceholder}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoComplete="one-time-code"
          required
        />
        {status === 'error' && <p className="text-sm text-danger-500">{errorMsg}</p>}
        <Button type="submit" variant="primary" size="md" loading={status === 'loading'} className="w-full">
          {t.auth.verifyOtp}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setStep('email')
            setOtp('')
            setStatus('idle')
            setErrorMsg('')
          }}
        >
          {t.auth.backToEmail}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
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
      {status === 'error' && <p className="text-sm text-danger-500">{errorMsg}</p>}
      <Button type="submit" variant="primary" size="md" loading={status === 'loading'} className="w-full">
        {t.auth.sendMagicLink}
      </Button>
    </form>
  )
}
