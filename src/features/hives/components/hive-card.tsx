import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardList, Trash2 } from 'lucide-react'
import { HiveSchematic } from './hive-schematic'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  useToggleHiveAccessory,
  useUpdateMelariCount,
  type HiveListItem,
} from '../hooks/use-hives'
import { t } from '@/i18n/it'

const REVEAL_W = 160

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
  onDelete?: (hiveId: string) => void
}

export function HiveCard({ hive, onDelete }: HiveCardProps) {
  const { mutate: toggle } = useToggleHiveAccessory()
  const { mutate: setMelari } = useUpdateMelariCount()

  const [melariCount, setMelariCount] = useState(hive.melariCount)
  useEffect(() => { setMelariCount(hive.melariCount) }, [hive.melariCount])

  // Swipe state
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const trackingRef = useRef(false)
  const [offsetX, setOffsetX] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [animate, setAnimate] = useState(false)

  function snapTo(px: number) {
    setAnimate(true)
    setOffsetX(px)
    setRevealed(px < 0)
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t0 = e.touches[0]
    if (!t0) return
    startRef.current = { x: t0.clientX, y: t0.clientY }
    trackingRef.current = false
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!startRef.current) return
    const t0 = e.touches[0]
    if (!t0) return
    const dx = t0.clientX - startRef.current.x
    const dy = t0.clientY - startRef.current.y
    if (!trackingRef.current) {
      const adx = Math.abs(dx); const ady = Math.abs(dy)
      if (adx < 5 && ady < 5) return
      trackingRef.current = adx > ady
    }
    if (!trackingRef.current) return
    setAnimate(false)
    const base = revealed ? -REVEAL_W : 0
    setOffsetX(Math.max(-REVEAL_W, Math.min(0, base + dx)))
  }

  function handleTouchEnd() {
    if (!trackingRef.current) return
    startRef.current = null
    // When already revealed, snap closed if dragged > 1/3 to the right (offsetX > -2/3*REVEAL_W)
    // When closed, snap open if dragged > 1/3 to the left (offsetX < -1/3*REVEAL_W)
    if (revealed) {
      snapTo(offsetX > -(REVEAL_W * 2 / 3) ? 0 : -REVEAL_W)
    } else {
      snapTo(offsetX < -(REVEAL_W / 3) ? -REVEAL_W : 0)
    }
  }

  function close() {
    snapTo(0)
  }

  const MELARI_OPTIONS = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
  ]

  function handleMelariChange(value: string) {
    const next = parseInt(value, 10)
    setMelariCount(next)
    setMelari({ hiveId: hive.id, count: next })
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Reveal panel */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: REVEAL_W }}
      >
        <Link
          to="/hives/$hiveId/inspections"
          params={{ hiveId: hive.id }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#5B8FA0] text-white"
        >
          <ClipboardList size={20} strokeWidth={1.75} />
          <span className="text-[11px] font-semibold leading-none">
            {t.inspection.list.title}
          </span>
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(hive.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-danger-500 text-white"
          >
            <Trash2 size={18} strokeWidth={1.75} />
            <span className="text-[11px] font-semibold leading-none">Elimina</span>
          </button>
        )}
      </div>

      {/* Swipeable card */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: animate ? 'transform 0.2s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={() => setAnimate(false)}
      >
        <div className="bg-cream-100 border border-cream-200 p-3 flex gap-3 shadow-xs">
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

            {/* Melari segmented control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-wood-500 w-16 shrink-0">{t.hive.card.melari}</span>
              <SegmentedControl
                options={MELARI_OPTIONS}
                value={String(melariCount)}
                onChange={handleMelariChange}
                ariaLabel="Melari"
              />
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
      </div>

      {/* Overlay: intercepts touch AND click on card area while revealed */}
      {revealed && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ right: REVEAL_W }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={close}
        />
      )}
    </div>
  )
}
