import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus, Trash2, Wheat } from 'lucide-react'
import { useHarvests, useDeleteHarvest } from '@/features/harvests/hooks/use-harvests'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { useToast } from '@/hooks/use-toast'
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

function RaccoltiPage() {
  const { data: harvests, isLoading } = useHarvests()
  const { mutate: deleteHarvest } = useDeleteHarvest()
  const { showToast } = useToast()
  const groups = harvests ? groupByYear(harvests) : []

  return (
    <div className="fixed inset-0 bg-cream-50 flex flex-col z-10">
      <header className="shrink-0 bg-cream-50/95 backdrop-blur-sm border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <Link
          to="/piu"
          aria-label="Indietro"
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </Link>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Raccolti
        </h1>
        <Link
          to="/raccolti/new"
          aria-label="Nuovo raccolto"
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <Plus size={22} strokeWidth={1.75} />
        </Link>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {isLoading && (
            <p className="text-sm text-wood-400">Caricamento raccolti…</p>
          )}

          {!isLoading && harvests?.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Wheat size={40} className="text-wood-300" />
              <p className="text-sm text-wood-500">Nessun raccolto ancora</p>
              <p className="text-xs text-wood-400 max-w-[240px]">
                Registra il primo raccolto per tenere traccia della produzione di miele.
              </p>
            </div>
          )}

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
                      <Link
                        to="/raccolti/$harvestId/edit"
                        params={{ harvestId: h.id }}
                        className="flex items-center justify-between border border-cream-200 bg-cream-100 px-4 py-3 hover:bg-cream-200 transition-colors w-full"
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
                      </Link>
                    </SwipeableRow>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
