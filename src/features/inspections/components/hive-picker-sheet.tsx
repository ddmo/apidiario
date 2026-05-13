import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface HivePickerSheetProps {
  open: boolean
  onClose: () => void
}

export function HivePickerSheet({ open, onClose }: HivePickerSheetProps) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const { data: apiaries, isPending: loadingApiaries } = useQuery({
    queryKey: ['apiaries-picker'],
    queryFn: async () => {
      const { data, error } = await supabase.from('apiaries').select('id, name').order('name')
      if (error) throw error
      return data
    },
    enabled: open,
    staleTime: 60 * 1000,
  })

  const { data: hives, isPending: loadingHives } = useQuery({
    queryKey: ['hives', 'attiva'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hives')
        .select('id, identifier, apiary_id')
        .eq('status', 'attiva')
        .order('identifier')
      if (error) throw error
      return data
    },
    enabled: open,
  })

  const isLoading = loadingApiaries || loadingHives

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function selectHive(hiveId: string) {
    onClose()
    await navigate({ to: '/inspections/$hiveId/new', params: { hiveId } })
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-wood-900/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleziona arnia"
        className="fixed inset-x-0 bottom-0 z-50 bg-cream-50 rounded-t-xl max-h-[75dvh] flex flex-col"
        style={{ boxShadow: '0 -12px 32px rgba(60, 40, 20, 0.18)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0 border-b border-cream-200">
          <h2 className="text-base font-semibold text-wood-800">Seleziona arnia</h2>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={onClose}
            className="size-9 flex items-center justify-center text-wood-500 hover:text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 [scrollbar-width:none] [padding-bottom:env(safe-area-inset-bottom)]">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <span className="size-5 rounded-full border-2 border-honey-500 border-t-transparent animate-spin" />
            </div>
          )}

          {!isLoading && (!apiaries?.length || !hives?.length) && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-wood-500">Nessuna arnia attiva trovata.</p>
              <p className="text-xs text-wood-400 mt-1">Crea prima un apiario e un'arnia.</p>
            </div>
          )}

          {!isLoading &&
            apiaries?.map((apiary) => {
              const apiaryHives = hives?.filter((h) => h.apiary_id === apiary.id) ?? []
              if (!apiaryHives.length) return null
              const isCollapsed = collapsed.has(apiary.id)

              return (
                <div key={apiary.id}>
                  {/* Apiary header */}
                  <button
                    type="button"
                    onClick={() => toggleCollapse(apiary.id)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-cream-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-wood-700">{apiary.name}</span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        'text-wood-400 transition-transform duration-150',
                        isCollapsed && '-rotate-90',
                      )}
                    />
                  </button>

                  {/* Hives */}
                  {!isCollapsed &&
                    apiaryHives.map((hive) => (
                      <button
                        key={hive.id}
                        type="button"
                        onClick={() => void selectHive(hive.id)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-cream-100 transition-colors border-t border-cream-200/60"
                      >
                        <span className="size-8 rounded-full bg-honey-300/30 text-honey-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {hive.identifier.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-wood-700">
                          Arnia {hive.identifier}
                        </span>
                      </button>
                    ))}
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}
