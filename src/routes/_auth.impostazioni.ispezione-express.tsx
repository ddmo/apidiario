import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useExpressFields, useUpdateExpressFields } from '@/features/inspections/hooks/use-express-fields'
import { EXPRESS_FIELD_OPTIONS, type ExpressField } from '@/features/inspections/express-fields-constants'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/_auth/impostazioni/ispezione-express')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: ExpressSettingsPage,
})

import { supabase } from '@/lib/supabase'

function ExpressSettingsPage() {
  const router = useRouter()
  const savedFields = useExpressFields()
  const { mutateAsync: saveFields, isPending } = useUpdateExpressFields()
  const { showToast } = useToast()

  const [fields, setFields] = useState<ExpressField[]>([])

  // Sync when query returns fresh data
  useEffect(() => {
    if (savedFields.length > 0) {
      setFields(savedFields)
    }
  }, [savedFields])

  const includedSet = new Set(fields)
  const excludedOptions = EXPRESS_FIELD_OPTIONS.filter((o) => !includedSet.has(o.key))

  function toggleField(key: ExpressField) {
    if (includedSet.has(key)) {
      setFields((prev) => prev.filter((f) => f !== key))
    } else {
      setFields((prev) => [...prev, key])
    }
  }

  function moveUp(key: ExpressField) {
    const idx = fields.indexOf(key)
    if (idx <= 0) return
    const next = [...fields]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setFields(next)
  }

  function moveDown(key: ExpressField) {
    const idx = fields.indexOf(key)
    if (idx < 0 || idx >= fields.length - 1) return
    const next = [...fields]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setFields(next)
  }

  async function handleSave() {
    try {
      await saveFields(fields)
      showToast('Preferenze salvate', 'success')
      router.history.back()
    } catch {
      showToast('Salvataggio fallito', 'error')
    }
  }

  const canSave = fields.length > 0

  return (
    <div className="fixed inset-0 bg-cream-50 text-wood-700 flex flex-col z-10">
      <header className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur-sm border-b border-cream-200">
        <div className="flex items-center gap-3 h-14 px-2">
          <button
            type="button"
            aria-label="Indietro"
            onClick={() => router.history.back()}
            className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-wood-800 truncate">Personalizza Express</div>
            <div className="text-xs text-wood-500">Scegli campi e ordine nella vista rapida</div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5" style={{ paddingBottom: 'calc(1rem + 3.5rem)' }}>
        <div className="flex flex-col gap-1">

          {fields.length === 0 && (
            <p className="text-sm text-wood-400 text-center py-8">Caricamento…</p>
          )}

          {/* Included fields (in user order) */}
          {fields.map((key, idx) => {
            const opt = EXPRESS_FIELD_OPTIONS.find((o) => o.key === key)
            if (!opt) return null
            const isFirst = idx === 0
            const isLast = idx === fields.length - 1
            return (
              <div
                key={opt.key}
                className="flex items-center gap-3 rounded-lg border border-cream-200 bg-cream-100 px-3 py-3 transition-colors"
              >
                <button
                  type="button"
                  aria-label={`Rimuovi ${opt.label}`}
                  onClick={() => toggleField(opt.key)}
                  className="size-9 shrink-0 rounded-md bg-honey-500 text-cream-50 flex items-center justify-center transition-colors"
                >
                  <Eye size={16} />
                </button>

                <span className="flex-1 min-w-0 text-sm font-medium text-wood-800">
                  {opt.label}
                </span>

                <div className="flex gap-0.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Sposta su"
                    disabled={isFirst}
                    onClick={() => moveUp(opt.key)}
                    className="size-8 flex items-center justify-center rounded-md text-wood-400 hover:text-wood-700 hover:bg-cream-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 10V2M2 6l4-4 4 4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Sposta giù"
                    disabled={isLast}
                    onClick={() => moveDown(opt.key)}
                    className="size-8 flex items-center justify-center rounded-md text-wood-400 hover:text-wood-700 hover:bg-cream-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2v8M2 6l4 4 4-4" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}

          {/* Separator */}
          {excludedOptions.length > 0 && fields.length > 0 && (
            <div className="border-t border-cream-200 my-3" />
          )}

          {/* Excluded fields (constant order) */}
          {excludedOptions.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center gap-3 rounded-lg border border-cream-200/60 bg-cream-50 opacity-60 px-3 py-3 transition-colors"
            >
              <button
                type="button"
                aria-label={`Aggiungi ${opt.label}`}
                onClick={() => toggleField(opt.key)}
                className="size-9 shrink-0 rounded-md bg-cream-200 text-wood-400 flex items-center justify-center transition-colors"
              >
                <EyeOff size={16} />
              </button>

              <span className="flex-1 min-w-0 text-sm font-medium text-wood-800">
                {opt.label}
                {!opt.defaultIncluded && (
                  <span className="ml-1.5 text-[10px] text-wood-400 font-normal">
                    (extra)
                  </span>
                )}
              </span>
            </div>
          ))}

        </div>
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-cream-200 bg-cream-50">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !canSave}
          className="w-full h-12 rounded-lg bg-honey-500 text-cream-50 text-sm font-semibold hover:bg-honey-600 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </div>
  )
}
