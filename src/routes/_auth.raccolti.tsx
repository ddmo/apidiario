import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Trash2, Wheat } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHarvests, useHarvest, useDeleteHarvest, useCreateHarvest, useUpdateHarvest } from '@/features/harvests/hooks/use-harvests'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { EmptyState } from '@/components/ui/empty-state'
import { Fab } from '@/components/ui/fab'
import { HarvestForm } from '@/features/harvests/components/harvest-form'
import type { HarvestFormData } from '@/features/harvests/components/harvest-form'
import { useToast } from '@/hooks/use-toast'
import { useIsTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { HarvestListItem } from '@/features/harvests/types'

export const Route = createFileRoute('/_auth/raccolti')({
  component: RaccoltiPage,
})

function formatKg(kg: number): string {
  return `${kg.toFixed(2).replace('.', ',')} kg`
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function groupByYear(items: HarvestListItem[]): [string, HarvestListItem[]][] {
  const map = new Map<string, HarvestListItem[]>()
  for (const h of items) {
    const year = h.harvested_on.slice(0, 4)
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(h)
  }
  return [...map.entries()]
}

/** Aggregazione derivata dai raccolti esistenti, non dati nuovi. */
function summarizeByType(items: HarvestListItem[]): { type: string; kg: number }[] {
  const map = new Map<string, number>()
  for (const h of items) map.set(h.honey_type, (map.get(h.honey_type) ?? 0) + h.total_kg)
  return [...map.entries()].map(([type, kg]) => ({ type, kg })).sort((a, b) => b.kg - a.kg)
}

type PanelView = 'list' | 'new' | 'edit'

function RaccoltiPage() {
  const navigate = useNavigate()
  const isTablet = useIsTablet()
  const { showToast } = useToast()
  const { data: harvests, isLoading } = useHarvests()
  const { mutate: deleteHarvest } = useDeleteHarvest()
  const createHarvest = useCreateHarvest()
  const updateHarvest = useUpdateHarvest()
  const [panelView, setPanelView] = useState<PanelView>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedHarvest } = useHarvest(panelView === 'edit' ? selectedId ?? undefined : undefined)
  const groups = harvests ? groupByYear(harvests) : []
  const summary = harvests ? summarizeByType(harvests) : []
  const yearTotal = harvests?.reduce((s, h) => s + h.total_kg, 0) ?? 0
  const maxTypeKg = Math.max(...summary.map((s) => s.kg), 1)

  function openNew() {
    if (isTablet) {
      setPanelView('new')
    } else {
      void navigate({ to: '/raccolti/new' })
    }
  }

  function openEdit(id: string) {
    if (isTablet) {
      setSelectedId(id)
      setPanelView('edit')
    } else {
      void navigate({ to: '/raccolti/$harvestId/edit', params: { harvestId: id } })
    }
  }

  async function handleCreate(data: HarvestFormData) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) return
    try {
      await createHarvest.mutateAsync({
        apiary_id: data.apiaryId,
        harvested_on: data.harvestedOn,
        honey_type: data.honeyType,
        total_kg: data.totalKg,
        humidity_pct: data.humidityPct,
        batch_code: data.batchCode,
        notes: data.notes,
        recorded_by: session.user.id,
      })
      showToast('Raccolto salvato', 'success')
      setPanelView('list')
    } catch {
      showToast('Salvataggio fallito', 'error')
    }
  }

  async function handleUpdate(data: HarvestFormData) {
    if (!selectedId) return
    try {
      await updateHarvest.mutateAsync({
        id: selectedId,
        apiary_id: data.apiaryId,
        harvested_on: data.harvestedOn,
        honey_type: data.honeyType,
        total_kg: data.totalKg,
        humidity_pct: data.humidityPct,
        batch_code: data.batchCode,
        notes: data.notes,
      })
      showToast('Raccolto aggiornato', 'success')
      setPanelView('list')
    } catch {
      showToast('Salvataggio fallito', 'error')
    }
  }

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 pl-4 pr-2 h-14 flex items-center gap-1">
        <h1 className="font-display text-lg font-medium text-wood-800 tracking-tight flex-1">Raccolti</h1>
        <button
          type="button"
          onClick={openNew}
          className="hidden tablet:flex h-9 px-3 items-center gap-1.5 rounded-md bg-honey-500 text-cream-50 text-sm font-medium hover:bg-honey-600 transition-colors mr-1"
        >
          <Plus size={16} strokeWidth={2} />
          Nuovo raccolto
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 tablet:flex tablet:items-start tablet:pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-wood-400 w-full">
            Caricamento…
          </div>
        ) : !harvests || harvests.length === 0 ? (
          <>
            <div className="px-4 pt-12 max-w-[360px] mx-auto w-full tablet:mx-0 tablet:w-[360px] tablet:shrink-0 tablet:border-r tablet:border-cream-200 tablet:h-full">
              <EmptyState
                icon={<Wheat size={40} strokeWidth={1.25} />}
                title="Nessun raccolto ancora"
                description="Registra il primo raccolto per tenere traccia della produzione di miele."
              />
            </div>
            <div className="hidden tablet:flex tablet:flex-1 tablet:min-w-0 tablet:h-full tablet:flex-col">
              {panelView === 'new' && (
                <HarvestForm
                  title="Nuovo raccolto"
                  hideHeader
                  onSave={handleCreate}
                  onCancel={() => setPanelView('list')}
                  isPending={createHarvest.isPending}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-4 pt-4 tablet:w-[360px] tablet:shrink-0 tablet:border-r tablet:border-cream-200 tablet:h-full tablet:overflow-y-auto">
              {groups.map(([year, items]) => {
                const total = items.reduce((s, h) => s + h.total_kg, 0)
                return (
                  <div key={year} className="mb-8">
                    <div className="flex items-baseline justify-between mb-3">
                      <h2 className="text-lg font-medium text-wood-700">{year}</h2>
                      <span className="text-sm font-medium text-wood-400 tabular-nums">{formatKg(total)}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((h) => (
                        <SwipeableRow
                          key={h.id}
                          revealWidth={84}
                          revealContent={
                            <button
                              type="button"
                              onClick={() => {
                                deleteHarvest(h.id, {
                                  onSuccess: () => showToast('Raccolto eliminato', 'success'),
                                  onError: () => showToast('Eliminazione fallita', 'error'),
                                })
                              }}
                              className="flex-1 flex flex-col items-center justify-center gap-1 bg-danger-500 text-white"
                            >
                              <Trash2 size={18} />
                              <span className="text-xs font-semibold leading-none">Elimina</span>
                            </button>
                          }
                        >
                          <button
                            type="button"
                            onClick={() => openEdit(h.id)}
                            className={cn(
                              'flex items-center justify-between border border-cream-200 bg-cream-100 px-4 py-3 hover:bg-cream-200 transition-colors w-full text-left',
                              panelView === 'edit' && selectedId === h.id && 'tablet:ring-2 tablet:ring-honey-500',
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-wood-800 truncate">
                                {h.honey_type}
                              </p>
                              <p className="text-xs text-wood-400 mt-0.5">
                                {h.apiary_name ?? '—'} · {formatDate(h.harvested_on)}
                                {h.batch_code && <> · lotto {h.batch_code}</>}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-wood-700 shrink-0 ml-3 tabular-nums">
                              {formatKg(h.total_kg)}
                            </span>
                          </button>
                        </SwipeableRow>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pannello destro — tablet/desktop: form inline oppure riepilogo per fioritura */}
            <div className="hidden tablet:flex tablet:flex-1 tablet:min-w-0 tablet:h-full tablet:flex-col">
              {panelView === 'new' ? (
                <HarvestForm
                  title="Nuovo raccolto"
                  hideHeader
                  onSave={handleCreate}
                  onCancel={() => setPanelView('list')}
                  isPending={createHarvest.isPending}
                />
              ) : panelView === 'edit' && selectedHarvest ? (
                <HarvestForm
                  title="Modifica raccolto"
                  hideHeader
                  initialData={{
                    apiaryId: selectedHarvest.apiary_id,
                    harvestedOn: selectedHarvest.harvested_on,
                    honeyType: selectedHarvest.honey_type,
                    totalKg: String(selectedHarvest.total_kg),
                    humidityPct: selectedHarvest.humidity_pct != null ? String(selectedHarvest.humidity_pct) : '',
                    batchCode: selectedHarvest.batch_code ?? '',
                    notes: selectedHarvest.notes ?? '',
                  }}
                  onSave={handleUpdate}
                  onCancel={() => setPanelView('list')}
                  isPending={updateHarvest.isPending}
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-5 flex">
                  {summary.length > 0 ? (
                    <div className="w-full max-w-xl">
                      <div className="rounded-xl bg-honey-tint px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-honey-700 uppercase tracking-wide mb-0.5">Totale</p>
                        <p className="text-2xl font-semibold text-wood-800 tabular-nums">{formatKg(yearTotal)}</p>
                      </div>
                      <p className="text-xs font-semibold text-wood-400 uppercase tracking-wide mb-3">Per fioritura</p>
                      <div className="flex flex-col gap-3">
                        {summary.map((s) => (
                          <div key={s.type}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium text-wood-700">{s.type}</span>
                              <span className="text-wood-500 tabular-nums">{formatKg(s.kg)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                              <div className="h-full rounded-full bg-honey-500" style={{ width: `${Math.round((s.kg / maxTypeKg) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-wood-400 m-auto">Seleziona un raccolto per vedere il dettaglio</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="tablet:hidden">
        <Fab
          icon={<Plus size={24} strokeWidth={2} aria-hidden="true" />}
          label="Nuovo raccolto"
          onClick={openNew}
        />
      </div>
    </div>
  )
}
