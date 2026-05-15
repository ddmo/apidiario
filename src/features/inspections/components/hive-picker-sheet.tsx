import { useState } from 'react'
import { ChevronDown, Check, X, Trees } from 'lucide-react'
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  const toggleHive = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function allSelected(apiaryId: string): boolean {
    const apiaryHives = hives?.filter((h) => h.apiary_id === apiaryId) ?? []
    return apiaryHives.length > 0 && apiaryHives.every((h) => selectedIds.has(h.id))
  }

  function toggleApiary(apiaryId: string) {
    const apiaryHives = hives?.filter((h) => h.apiary_id === apiaryId) ?? []
    const allSel = allSelected(apiaryId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const h of apiaryHives) {
        if (allSel) { next.delete(h.id) } else { next.add(h.id) }
      }
      return next
    })
  }

  function handleClose() {
    setSelectedIds(new Set())
    onClose()
  }

  function proceed() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    handleClose()
    if (ids.length === 1) {
      navigate({ to: '/inspections/$hiveId/new', params: { hiveId: ids[0]! } })
    } else {
      const first = hives?.find((h) => h.id === ids[0])
      if (!first) return
      navigate({
        to: '/inspections/batch/$apiaryId',
        params: { apiaryId: first.apiary_id },
        search: { selected: ids },
      })
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-wood-900/40" onClick={handleClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleziona arnie"
        className="fixed inset-x-0 bottom-0 z-50 bg-cream-50 rounded-t-xl max-h-[75dvh] flex flex-col"
        style={{ boxShadow: '0 -12px 32px rgba(60, 40, 20, 0.18)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0 border-b border-cream-200">
          <h2 className="text-base font-semibold text-wood-800">Seleziona arnie</h2>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={handleClose}
            className="size-9 flex items-center justify-center text-wood-500 hover:text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 [scrollbar-width:none]">
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
              const allSel = allSelected(apiary.id)

              return (
                <div key={apiary.id}>
                  {/* Apiary header */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(apiary.id)}
                      className="flex items-center gap-2"
                    >
                      <ChevronDown
                        size={18}
                        className={cn(
                          'text-wood-400 transition-transform duration-150',
                          isCollapsed && '-rotate-90',
                        )}
                      />
                      <span className="text-sm font-semibold text-wood-700">{apiary.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleApiary(apiary.id)}
                      className="text-xs font-medium text-honey-600 hover:text-honey-700 px-2 py-1 rounded-md hover:bg-cream-100 transition-colors"
                    >
                      {allSel ? 'Deseleziona tutte' : 'Seleziona tutte'}
                    </button>
                  </div>

                  {/* Hives */}
                  {!isCollapsed &&
                    apiaryHives.map((hive) => {
                      const selected = selectedIds.has(hive.id)
                      return (
                        <button
                          key={hive.id}
                          type="button"
                          onClick={() => toggleHive(hive.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-5 py-3.5 hover:bg-cream-100 transition-colors border-t border-cream-200/60',
                            selected && 'bg-honey-500/5',
                          )}
                        >
                          <div
                            className={cn(
                              'size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                              selected
                                ? 'bg-honey-500 border-honey-500'
                                : 'border-wood-300',
                            )}
                          >
                            {selected && <Check size={14} className="text-white" />}
                          </div>
                          <Trees size={16} className="text-wood-400 shrink-0" />
                          <span className="text-sm font-medium text-wood-700">
                            Arnia {hive.identifier}
                          </span>
                        </button>
                      )
                    })}
                </div>
              )
            })}
        </div>

        {/* Bottom bar */}
        {selectedIds.size >= 1 && (
          <div className="shrink-0 border-t border-cream-200 px-4 py-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={proceed}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 text-sm font-medium text-cream-50 hover:bg-honey-600 transition-colors"
            >
              <Check size={16} />
              {selectedIds.size === 1
                ? 'Ispezione singola'
                : `Ispezione multipla (${selectedIds.size} arnie)`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
