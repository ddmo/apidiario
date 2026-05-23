import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'

type Status = 'verifying' | 'error' | 'done'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    let cancelled = false

    // Ascolta PASSWORD_RECOVERY — copre il caso in cui Supabase
    // elabori il token prima che React monti
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !cancelled && !doneRef.current) {
        doneRef.current = true
        setStatus('done')
        window.location.href = '/set-password'
      }
    })

    async function handleCallback() {
      const fragment = window.location.hash.replace(/^#/, '')
      const search = window.location.search.replace(/^\?/, '')
      const raw = fragment || search
      const params = new URLSearchParams(raw)
      const type = params.get('type')
      const tokenHash = params.get('token_hash')

      // Flusso PKCE: token_hash presente → verifyOtp
      if (type && tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as 'recovery' | 'signup' | 'magiclink' | 'invite',
          token_hash: tokenHash,
        })
        if (cancelled) return
        if (error) {
          setStatus('error')
          setErrorMsg(error.message)
        } else {
          doneRef.current = true
          setStatus('done')
          window.location.href = '/set-password'
        }
        return
      }

      // Flusso implicito o callback già processato: aspetta sessione
      // type === 'recovery' senza token_hash → redirect diretto
      const isRecovery = type === 'recovery'
      const { data: { session } } = await supabase.auth.getSession()

      if ((isRecovery || session) && !cancelled && !doneRef.current) {
        doneRef.current = true
        setStatus('done')
        window.location.href = '/set-password'
      } else if (!cancelled && !doneRef.current) {
        setStatus('error')
        setErrorMsg('Link non valido o scaduto.')
      }
    }

    handleCallback()
    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  if (status === 'verifying') {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-wood-500">Verifica in corso&hellip;</p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <div className="text-center">
          <p className="text-danger-500 mb-4">{errorMsg}</p>
          <a href="/login" className="text-honey-600 underline underline-offset-2">
            Torna al login
          </a>
        </div>
      </main>
    )
  }

  return null
}
