import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAuthUser } from '@/lib/auth-guard'
import { useSuggestionFilters, useUpdateSuggestionFilters } from '@/features/suggestions/hooks/use-suggestion-filters'
import {
  ALL_SUGGESTION_FILTER_KEYS,
  SUGGESTION_CATEGORY_LABELS,
  SUGGESTION_FILTER_OPTIONS,
  type SuggestionFilterCategory,
} from '@/lib/suggestions/suggestion-filter-constants'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/_auth/impostazioni/suggerimenti')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: SuggestionSettingsPage,
})

const CATEGORY_ORDER: SuggestionFilterCategory[] = [
  'queen', 'health', 'schedule', 'population', 'swarming', 'equipment', 'harvest',
]

function SuggestionSettingsPage() {
  const router = useRouter()
  const savedFilters = useSuggestionFilters()
  const { mutateAsync: saveFilters, isPending } = useUpdateSuggestionFilters()
  const { showToast } = useToast()

  const [enabled, setEnabled] = useState<Set<string> | null>(null)
  const [openHelp, setOpenHelp] = useState<string | null>(null)

  useEffect(() => {
    if (enabled === null && savedFilters !== undefined) {
      setEnabled(new Set(savedFilters))
    }
  }, [savedFilters, enabled])

  function toggle(key: string) {
    setEnabled((prev) => {
      if (!prev) return prev
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  async function handleSave() {
    if (!enabled) return
    try {
      await saveFilters([...enabled])
      showToast('Preferenze salvate', 'success')
      router.history.back()
    } catch {
      showToast('Salvataggio fallito', 'error')
    }
  }

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
            <div className="text-sm font-semibold text-wood-800 truncate">Suggerimenti</div>
            <div className="text-xs text-wood-500">Scegli quali tipi mostrare</div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5" style={{ paddingBottom: 'calc(1rem + 3.5rem)' }}>
        {enabled === null ? (
          <p className="text-sm text-wood-400 text-center py-8">Caricamento…</p>
        ) : (
          <div className="flex flex-col gap-6">
            {CATEGORY_ORDER.map((category) => {
              const options = SUGGESTION_FILTER_OPTIONS.filter((o) => o.category === category)
              if (options.length === 0) return null
              return (
                <div key={category} className="flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-1">
                    {SUGGESTION_CATEGORY_LABELS[category]}
                  </p>
                  {options.map((opt) => {
                    const on = enabled.has(opt.key)
                    const helpOpen = openHelp === opt.key
                    return (
                      <div key={opt.key} className={`rounded-md border transition-colors ${on ? 'bg-honey-300/60 border-honey-500' : 'bg-cream-50 border-cream-200'}`}>
                        <div className="flex items-center h-12 px-3 gap-2">
                          <button
                            type="button"
                            aria-label={`Quando appare: ${opt.label}`}
                            onClick={() => setOpenHelp(helpOpen ? null : opt.key)}
                            className="size-6 shrink-0 flex items-center justify-center text-wood-400 hover:text-wood-600 transition-colors"
                          >
                            <HelpCircle size={18} strokeWidth={2.25} />
                          </button>
                          <span className={`flex-1 text-sm font-medium ${on ? 'text-wood-800' : 'text-wood-500'}`}>
                            {opt.label}
                          </span>
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(opt.key)}
                            className="shrink-0"
                          >
                            <span className={`h-6 w-10 rounded-full p-0.5 flex transition-colors duration-150 ${on ? 'bg-honey-500' : 'bg-cream-200'}`}>
                              <span className={`size-5 rounded-full bg-cream-50 transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
                            </span>
                          </button>
                        </div>
                        {helpOpen && (
                          <p className="px-3 pb-3 text-xs text-wood-500 leading-relaxed border-t border-cream-200/60 pt-2">
                            {opt.whenDescription}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-cream-200 bg-cream-50">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || enabled === null}
          className="w-full h-12 rounded-lg bg-honey-500 text-cream-50 text-sm font-semibold hover:bg-honey-600 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </div>
  )
}
