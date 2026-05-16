import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useApiaryShares, useRevokeApiaryAccess } from '../hooks/use-apiaries'
import { X, Loader2 } from 'lucide-react'

interface ShareSheetProps {
  open: boolean
  apiaryId: string
  apiaryName: string
  onClose: () => void
}

export function ShareSheet({ open, apiaryId, apiaryName, onClose }: ShareSheetProps) {
  const { data: shares = [], isLoading: sharesLoading } = useApiaryShares(open ? apiaryId : '')
  const { mutate: revokeAccess, isPending: revoking } = useRevokeApiaryAccess()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('reader')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const ROLE_OPTIONS = [
    { value: 'reader', label: 'Lettura' },
    { value: 'editor', label: 'Scrittura' },
  ]

  function roleLabel(r: string) {
    return r === 'editor' ? 'Scrittura' : 'Lettura'
  }

  async function handleSubmit() {
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.functions.invoke('grant-apiary-access', {
      body: { apiary_id: apiaryId, email: email.trim(), role },
    })

    if (error) {
      let errorMsg = 'Errore durante la condivisione'
      try {
        const body = await (error as any).context?.json()
        errorMsg = body?.error ?? error.message
      } catch {
        errorMsg = error.message ?? errorMsg
      }
      setStatus('error')
      setErrorMsg(errorMsg)
      return
    }

    setStatus('success')
    setEmail('')
    void queryClient.invalidateQueries({ queryKey: ['apiaryShares', apiaryId] })
  }

  function handleRevoke(userId: string) {
    revokeAccess({ apiaryId, userId })
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
        className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg max-h-[80dvh] flex flex-col"
      >
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
        </div>
        <div className="px-5 pt-3 shrink-0 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-wood-800">Condividi apiario</h2>
            <p className="text-sm text-wood-500 mt-0.5">{apiaryName}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Chiudi"
            className="size-8 flex items-center justify-center rounded-md text-wood-400 hover:text-wood-600 hover:bg-cream-100 transition-colors shrink-0 mt-0.5"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pt-5 flex flex-col gap-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
          {/* Active shares */}
          {sharesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-wood-400" />
            </div>
          ) : shares.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs uppercase tracking-wider font-semibold text-wood-500">Condiviso con</p>
              {shares.map((s) => (
                <div
                  key={s.userId}
                  className="flex items-center gap-2 bg-cream-100 rounded-lg px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wood-800 truncate">{s.displayName}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5 ${
                        s.role === 'editor'
                          ? 'bg-honey-100 text-honey-700'
                          : 'bg-wood-100 text-wood-600'
                      }`}
                    >
                      {roleLabel(s.role)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(s.userId)}
                    disabled={revoking}
                    aria-label={`Rimuovi accesso a ${s.displayName}`}
                    className="size-8 flex items-center justify-center rounded-md text-wood-400 hover:text-danger-500 hover:bg-cream-200 transition-colors"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-wood-400 text-center py-2">Nessuna condivisione attiva</p>
          )}

          {/* Add new share */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-wood-500">Aggiungi utente</p>
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
              <div className="flex flex-col gap-3">
                <div className="bg-success-100 border border-success-100 rounded-xl px-4 py-3 text-sm text-success-500 font-medium">
                  Accesso concesso! L'utente vedra' l'apiario nella sua home.
                </div>
                <Button variant="primary" size="lg" onClick={handleClose} className="w-full">
                  Fatto
                </Button>
              </div>
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
      </div>
    </>
  )
}
