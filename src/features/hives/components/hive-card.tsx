import { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardList, Trash2, Pencil, DoorOpen, Grid3x3, Flower, Droplets, ClipboardCheck } from 'lucide-react'
import { HiveSchematic } from './hive-schematic'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  useToggleHiveAccessory,
  useUpdateMelariCount,
  type HiveListItem,
} from '../hooks/use-hives'
import { useActiveMelariBlock } from '@/features/treatments/hooks/use-treatments'
import { t } from '@/i18n/it'

const REVEAL_W = 240

function relativeDate(iso: string): string {
  const now = new Date()
  const then = new Date(iso)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thatDay = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const d = Math.round((today.getTime() - thatDay.getTime()) / 86_400_000)
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

export function HiveCard({ hive, onDelete, showSchematic = true }: HiveCardProps & { showSchematic?: boolean }) {
  const { mutate: toggle } = useToggleHiveAccessory()
  const { mutate: updateMelari } = useUpdateMelariCount()
  const { data: melariBlock } = useActiveMelariBlock(hive.id, hive.apiaryId)
  const [showMelariWarning, setShowMelariWarning] = useState(false)
  const [pendingMelariCount, setPendingMelariCount] = useState(0)

  const MELARI_OPTIONS = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
  ]

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
        <Link
          to="/hives/$hiveId/edit"
          params={{ hiveId: hive.id }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-honey-500 text-white"
        >
          <Pencil size={18} strokeWidth={1.75} />
          <span className="text-[11px] font-semibold leading-none">Modifica</span>
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
        <div className="bg-cream-100 border border-cream-200 px-3 py-2 shadow-xs">
          {showSchematic ? (
            <div className="flex gap-3">
              {/* Schematic */}
              <div className="w-[96px] shrink-0 flex items-center self-stretch bg-cream-200/50 rounded-lg">
                <HiveSchematic
                  nidoFrameCount={hive.nidoFrameCount}
                  melariCount={hive.melariCount}
                  hasApiscampo={hive.hasApiscampo}
                  hasPropolisNet={hive.hasPropolisNet}
                  hasPollenTrap={hive.hasPollenTrap}
                  hasActiveQueen={hive.hasActiveQueen}
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                {/* Name + Last inspection */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-wood-800 text-base leading-tight truncate">
                      {hive.identifier}
                    </p>
                    {hive.apiaryName && (
                      <p className="text-xs text-honey-600 font-medium truncate">{hive.apiaryName}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-wood-400 shrink-0 flex items-center gap-1 mt-1">
                    <ClipboardCheck size={10} className="shrink-0" />
                    {hive.lastInspection
                      ? relativeDate(hive.lastInspection.performedAt)
                      : t.hive.card.noVisit}
                  </p>
                </div>

                {/* Melari — icon + control on same row */}
                <div className="flex items-center gap-1">
                  <Droplets size={14} className="text-wood-400 shrink-0" />
                  <SegmentedControl
                    options={MELARI_OPTIONS}
                    value={String(hive.melariCount)}
                    onChange={(v) => {
                      const count = Number(v)
                      if (count > hive.melariCount && melariBlock) {
                        setPendingMelariCount(count)
                        setShowMelariWarning(true)
                      } else {
                        updateMelari({ hiveId: hive.id, count })
                      }
                    }}
                    ariaLabel="Numero melari"
                  />
                </div>

                {/* Accessory toggles */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    aria-label={t.hive.card.apiscampo}
                    onClick={() =>
                      toggle({ hiveId: hive.id, field: 'has_apiscampo', value: !hive.hasApiscampo })
                    }
                    className={`size-9 flex items-center justify-center rounded-md border transition-colors ${
                      hive.hasApiscampo
                        ? 'bg-[#5B8FA0] border-[#4A7A8E] text-white'
                        : 'bg-cream-50 border-cream-200 text-wood-400'
                    }`}
                  >
                    <DoorOpen size={18} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={t.hive.card.propoilsNet}
                    onClick={() =>
                      toggle({ hiveId: hive.id, field: 'has_propolis_net', value: !hive.hasPropolisNet })
                    }
                    className={`size-9 flex items-center justify-center rounded-md border transition-colors ${
                      hive.hasPropolisNet
                        ? 'bg-[#4A6E3C] border-[#3A5A2E] text-white'
                        : 'bg-cream-50 border-cream-200 text-wood-400'
                    }`}
                  >
                    <Grid3x3 size={18} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={t.hive.card.pollenTrap}
                    onClick={() =>
                      toggle({ hiveId: hive.id, field: 'has_pollen_trap', value: !hive.hasPollenTrap })
                    }
                    className={`size-9 flex items-center justify-center rounded-md border transition-colors ${
                      hive.hasPollenTrap
                        ? 'bg-honey-500 border-honey-600 text-wood-900'
                        : 'bg-cream-50 border-cream-200 text-wood-400'
                    }`}
                  >
                    <Flower size={18} strokeWidth={1.75} />
                  </button>
                </div>

                {/* Inspect button */}
                <Link
                  to="/inspections/$hiveId/new"
                  params={{ hiveId: hive.id }}
                  className="inline-flex items-center justify-center h-8 px-4 bg-honey-400 text-wood-900 rounded-lg text-sm font-semibold w-full"
                >
                  {t.hive.card.inspect}
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {/* Row 1: Name + Last inspection */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-wood-800 text-base leading-tight truncate">
                    {hive.identifier}
                  </p>
                  {hive.apiaryName && (
                    <p className="text-xs text-honey-600 font-medium truncate">{hive.apiaryName}</p>
                  )}
                </div>
                <p className="text-[10px] text-wood-400 shrink-0 flex items-center gap-1">
                  <ClipboardCheck size={10} className="shrink-0" />
                  {hive.lastInspection
                    ? relativeDate(hive.lastInspection.performedAt)
                    : t.hive.card.noVisit}
                </p>
              </div>

              {/* Row 2: Melari icon + control */}
              <div className="flex items-center gap-1">
                <Droplets size={14} className="text-wood-400 shrink-0" />
                <SegmentedControl
                  options={MELARI_OPTIONS}
                  value={String(hive.melariCount)}
                  onChange={(v) => {
                    const count = Number(v)
                    if (count > hive.melariCount && melariBlock) {
                      setPendingMelariCount(count)
                      setShowMelariWarning(true)
                    } else {
                      updateMelari({ hiveId: hive.id, count })
                    }
                  }}
                  ariaLabel="Numero melari"
                  compact
                />
              </div>

              {/* Row 3: Togglers + Inspect */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={t.hive.card.apiscampo}
                    onClick={() =>
                      toggle({ hiveId: hive.id, field: 'has_apiscampo', value: !hive.hasApiscampo })
                    }
                    className={`size-8 flex items-center justify-center rounded-md border transition-colors ${
                      hive.hasApiscampo
                        ? 'bg-[#5B8FA0] border-[#4A7A8E] text-white'
                        : 'bg-cream-50 border-cream-200 text-wood-400'
                    }`}
                  >
                    <DoorOpen size={16} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={t.hive.card.propoilsNet}
                    onClick={() =>
                      toggle({ hiveId: hive.id, field: 'has_propolis_net', value: !hive.hasPropolisNet })
                    }
                    className={`size-8 flex items-center justify-center rounded-md border transition-colors ${
                      hive.hasPropolisNet
                        ? 'bg-[#4A6E3C] border-[#3A5A2E] text-white'
                        : 'bg-cream-50 border-cream-200 text-wood-400'
                    }`}
                  >
                    <Grid3x3 size={16} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={t.hive.card.pollenTrap}
                    onClick={() =>
                      toggle({ hiveId: hive.id, field: 'has_pollen_trap', value: !hive.hasPollenTrap })
                    }
                    className={`size-8 flex items-center justify-center rounded-md border transition-colors ${
                      hive.hasPollenTrap
                        ? 'bg-honey-500 border-honey-600 text-wood-900'
                        : 'bg-cream-50 border-cream-200 text-wood-400'
                    }`}
                  >
                    <Flower size={16} strokeWidth={1.75} />
                  </button>
                </div>
                <Link
                  to="/inspections/$hiveId/new"
                  params={{ hiveId: hive.id }}
                  className="inline-flex items-center justify-center h-8 px-4 bg-honey-400 text-wood-900 rounded-lg text-sm font-semibold ml-auto"
                >
                  {t.hive.card.inspect}
                </Link>
              </div>
            </div>
          )}
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

      {/* Melari block warning */}
      {showMelariWarning && (
        <>
          <div className="fixed inset-0 z-30 bg-wood-900/40" onClick={() => setShowMelariWarning(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Trattamento in corso" className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg">
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">Trattamento in corso</h2>
              <p className="text-sm text-wood-500 leading-relaxed">
                &ldquo;{melariBlock?.productName}&rdquo; &egrave; attivo su questa arnia e blocca i melari. Sei sicuro di voler aggiungere un melario?
              </p>
            </div>
            <div className="px-4 flex flex-col gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  updateMelari({ hiveId: hive.id, count: pendingMelariCount })
                  setShowMelariWarning(false)
                }}
                className="w-full h-13 flex items-center justify-center gap-2 rounded-md font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Aggiungi comunque
              </button>
              <button
                type="button"
                onClick={() => setShowMelariWarning(false)}
                className="w-full h-11 flex items-center justify-center rounded-md font-medium bg-transparent text-wood-700 hover:bg-cream-100 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
