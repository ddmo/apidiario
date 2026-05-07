import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Minus, Plus } from 'lucide-react'
import { HiveSchematic } from './hive-schematic'
import {
  useToggleHiveAccessory,
  useUpdateMelariCount,
  type HiveListItem,
} from '../hooks/use-hives'
import { t } from '@/i18n/it'

function relativeDate(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return 'oggi'
  if (d === 1) return 'ieri'
  if (d < 7) return `${d} giorni fa`
  if (d < 30) return `${Math.floor(d / 7)} sett. fa`
  if (d < 365) return `${Math.floor(d / 30)} mesi fa`
  return `${Math.floor(d / 365)} anni fa`
}

interface HiveCardProps {
  hive: HiveListItem
}

export function HiveCard({ hive }: HiveCardProps) {
  const { mutate: toggle } = useToggleHiveAccessory()
  const { mutate: setMelari } = useUpdateMelariCount()

  // Local optimistic state so schematic updates instantly on tap
  const [melariCount, setMelariCount] = useState(hive.melariCount)
  useEffect(() => { setMelariCount(hive.melariCount) }, [hive.melariCount])

  function changeMelari(delta: number) {
    const next = Math.max(0, Math.min(10, melariCount + delta))
    if (next !== melariCount) {
      setMelariCount(next)
      setMelari({ hiveId: hive.id, count: next })
    }
  }

  return (
    <div className="bg-cream-100 border border-cream-200 rounded-xl p-3 flex gap-3 shadow-xs">
      {/* Schematic */}
      <div className="w-[96px] shrink-0 flex items-center self-stretch">
        <HiveSchematic
          nidoFrameCount={hive.nidoFrameCount}
          melariCount={melariCount}
          hasApiscampo={hive.hasApiscampo}
          hasPropolisNet={hive.hasPropolisNet}
          hasPollenTrap={hive.hasPollenTrap}
          hasActiveQueen={hive.hasActiveQueen}
        />
      </div>

      {/* Info + actions */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Name + last visit */}
        <div>
          <p className="font-semibold text-wood-800 text-base leading-tight truncate">
            {hive.identifier}
          </p>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            {hive.apiaryName && (
              <p className="text-xs text-honey-600 font-medium truncate">{hive.apiaryName}</p>
            )}
            <p className={`text-xs text-wood-400 shrink-0 ${!hive.apiaryName ? 'ml-auto' : ''}`}>
              {hive.lastInspection
                ? relativeDate(hive.lastInspection.performedAt)
                : t.hive.card.noVisit}
            </p>
          </div>
        </div>

        {/* Melari counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-wood-500 w-16 shrink-0">{t.hive.card.melari}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Rimuovi melario"
              disabled={melariCount === 0}
              onClick={() => changeMelari(-1)}
              className="size-7 flex items-center justify-center rounded-md border border-cream-200 bg-cream-50 text-wood-600 disabled:opacity-30 transition-colors active:bg-cream-200"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="w-5 text-center text-sm font-semibold text-wood-800">
              {melariCount}
            </span>
            <button
              type="button"
              aria-label="Aggiungi melario"
              disabled={melariCount >= 10}
              onClick={() => changeMelari(1)}
              className="size-7 flex items-center justify-center rounded-md border border-cream-200 bg-cream-50 text-wood-600 disabled:opacity-30 transition-colors active:bg-cream-200"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Accessory toggles */}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              toggle({ hiveId: hive.id, field: 'has_apiscampo', value: !hive.hasApiscampo })
            }
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              hive.hasApiscampo
                ? 'bg-[#5B8FA0] border-[#4A7A8E] text-white'
                : 'bg-cream-50 border-cream-200 text-wood-400'
            }`}
          >
            {t.hive.card.apiscampo}
          </button>
          <button
            type="button"
            onClick={() =>
              toggle({ hiveId: hive.id, field: 'has_propolis_net', value: !hive.hasPropolisNet })
            }
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              hive.hasPropolisNet
                ? 'bg-[#4A6E3C] border-[#3A5A2E] text-white'
                : 'bg-cream-50 border-cream-200 text-wood-400'
            }`}
          >
            {t.hive.card.propoilsNet}
          </button>
          <button
            type="button"
            onClick={() =>
              toggle({ hiveId: hive.id, field: 'has_pollen_trap', value: !hive.hasPollenTrap })
            }
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              hive.hasPollenTrap
                ? 'bg-honey-600 border-honey-700 text-white'
                : 'bg-cream-50 border-cream-200 text-wood-400'
            }`}
          >
            {t.hive.card.pollenTrap}
          </button>
        </div>

        {/* Inspect button */}
        <Link
          to="/inspections/$hiveId/new"
          params={{ hiveId: hive.id }}
          className="inline-flex items-center justify-center h-9 px-4 bg-honey-400 text-wood-900 rounded-lg text-sm font-semibold w-full mt-1"
        >
          {t.hive.card.inspect}
        </Link>
      </div>
    </div>
  )
}
