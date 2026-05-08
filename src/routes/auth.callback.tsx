import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

type Status = 'verifying' | 'error' | 'done'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      // Il token arriva come hash fragment (#type=...&token_hash=...) o query param
      const fragment = window.location.hash.replace(/^#/, '')
      const search = window.location.search.replace(/^\?/, '')
      const raw = fragment || search
      const params = new URLSearchParams(raw)
      const type = params.get('type')
      const tokenHash = params.get('token_hash')

      if (!type || !tokenHash) {
        // Fallback: token gia' consumato (es. refresh pagina)
        const { data: { session } } = await supabase.auth.getSession()
        if (session && !cancelled) {
          setStatus('done')
          window.location.href = '/set-password'
        } else if (!cancelled) {
          setStatus('error')
          setErrorMsg('Link non valido o scaduto.')
        }
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        type: type as 'invite' | 'recovery' | 'signup' | 'magiclink',
        token_hash: tokenHash,
      })

      if (cancelled) return

      if (error) {
        setStatus('error')
        setErrorMsg(error.message)
      } else {
        setStatus('done')
        window.location.href = '/set-password'
      }
    }

    handleCallback()
    return () => { cancelled = true }
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
