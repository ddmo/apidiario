import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'

interface ShareSheetProps {
  open: boolean
  apiaryId: string
  apiaryName: string
  onClose: () => void
  onShared: () => void
}

export function ShareSheet({ open, apiaryId, apiaryName, onClose, onShared }: ShareSheetProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('reader')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const ROLE_OPTIONS = [
    { value: 'reader', label: 'Lettura' },
    { value: 'editor', label: 'Scrittura' },
  ]

  async function handleSubmit() {
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.functions.invoke('grant-apiary-access', {
      body: { apiary_id: apiaryId, email: email.trim(), role },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message || 'Errore durante la condivisione')
      return
    }

    setStatus('success')
    setEmail('')
    onShared()
  }

  function handleClose() {
    setEmail('')
    setRole('reader')
    setStatus('idle')
    setErrorMsg('')
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-wood-900/40"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Condividi apiario"
        className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg"
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
        </div>
        <div className="px-5 pt-3">
          <h2 className="text-lg font-semibold text-wood-800">Condividi apiario</h2>
          <p className="text-sm text-wood-500 mt-0.5">{apiaryName}</p>
        </div>

        <div className="px-4 pt-5 flex flex-col gap-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
          <Input
            id="share-email"
            label="Email utente"
            type="email"
            placeholder="nome@esempio.it"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
            disabled={status === 'loading'}
            error={status === 'error' ? errorMsg : undefined}
          />

          <div>
            <label className="block text-sm font-medium text-wood-600 mb-1.5">Ruolo</label>
            <SegmentedControl
              options={ROLE_OPTIONS}
              value={role}
              onChange={(v) => setRole(v)}
              ariaLabel="Ruolo di accesso"
            />
          </div>

          {status === 'success' ? (
            <Button variant="primary" size="lg" onClick={handleClose} className="w-full">
              Fatto
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              className="w-full"
              loading={status === 'loading'}
              disabled={!email.trim() || status === 'loading'}
            >
              Condividi
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
