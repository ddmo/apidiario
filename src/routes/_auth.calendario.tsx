import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, List, Calendar, Syringe } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/calendario')({
  component: CalendarioPage,
})

// ── Data layer ──────────────────────────────────────────────────────────────

type InspectionEvent = {
  id: string
  performed_at: string
  hive_id: string
  hiveIdentifier: string
  apiaryName: string
  performerDisplayName: string | null
}

type TreatmentEvent = {
  id: string
  date: string
  endDate: string | null
  productName: string
  apiaryName: string
  blocksMelari: boolean
}

function useTreatmentEvents(year: number, month: number) {
  const start = new Date(year, month, 1).toISOString()
  const end = new Date(year, month + 1, 1).toISOString()
  return useQuery({
    queryKey: ['treatmentEvents', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('id, product_name, start_date, end_date, blocks_melari, apiaries!inner(name)')
        .gte('start_date', start)
        .lt('start_date', end)
        .order('start_date', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row) => {
        const apiary = Array.isArray(row.apiaries) ? row.apiaries[0] : row.apiaries
        return {
          id: row.id,
          date: row.start_date,
          endDate: row.end_date,
          productName: row.product_name,
          apiaryName: (apiary as { name: string } | null)?.name ?? '?',
          blocksMelari: row.blocks_melari,
        } satisfies TreatmentEvent
      })
    },
  })
}

function useInspectionEvents(year: number, month: number) {
  const start = new Date(year, month, 1).toISOString()
  const end = new Date(year, month + 1, 1).toISOString()
  return useQuery({
    queryKey: ['inspectionEvents', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('id, performed_at, hive_id, performed_by, hives!inner(identifier, apiaries!inner(name)), profiles!inner(display_name)')
        .gte('performed_at', start)
        .lt('performed_at', end)
        .order('performed_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row) => {
        const hive = Array.isArray(row.hives) ? row.hives[0] : row.hives
        const apiary = Array.isArray(hive?.apiaries) ? hive.apiaries[0] : hive?.apiaries
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
          id: row.id,
          performed_at: row.performed_at,
          hive_id: row.hive_id,
          hiveIdentifier: (hive as { identifier: string } | null)?.identifier ?? '?',
          apiaryName: (apiary as { name: string } | null)?.name ?? '?',
          performerDisplayName: (profile as { display_name: string } | null)?.display_name ?? null,
        } satisfies InspectionEvent
      })
    },
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const DOW_LABELS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildGrid(year: number, month: number) {
  // Returns a 6×7 array (rows × cols Mon=0…Sun=6) of day numbers (1-based) or 0 for padding
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  // Monday-based week: Monday=0 … Sunday=6
  const startDow = (firstDay.getDay() + 6) % 7
  const cells: number[] = []
  for (let i = 0; i < startDow; i++) cells.push(0)
  for (let d = 1; d <= lastDay; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(0)
  const rows: number[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

// ── Page ─────────────────────────────────────────────────────────────────────

function CalendarioPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: inspections = [], isLoading: inspLoading } = useInspectionEvents(year, month)
  const { data: treatments = [], isLoading: treatLoading } = useTreatmentEvents(year, month)
  const isLoading = inspLoading || treatLoading

  type CalendarEvent =
    | { kind: 'inspection'; id: string; hiveId: string; hiveIdentifier: string; apiaryName: string; performerDisplayName: string | null; date: string; time: string }
    | { kind: 'treatment'; id: string; productName: string; apiaryName: string; blocksMelari: boolean; date: string }

  // Merge both event types into a single "YYYY-MM-DD" → CalendarEvent[] map
  const eventsByDay: Record<string, CalendarEvent[]> = {}

  for (const ev of inspections) {
    const key = isoDate(new Date(ev.performed_at))
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push({
      kind: 'inspection',
      id: ev.id,
      hiveId: ev.hive_id,
      hiveIdentifier: ev.hiveIdentifier,
      apiaryName: ev.apiaryName,
      performerDisplayName: ev.performerDisplayName,
      date: ev.performed_at,
      time: new Date(ev.performed_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    })
  }

  for (const tr of treatments) {
    const key = isoDate(new Date(tr.date))
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push({
      kind: 'treatment',
      id: tr.id,
      productName: tr.productName,
      apiaryName: tr.apiaryName,
      blocksMelari: tr.blocksMelari,
      date: tr.date,
    })
  }

  const grid = buildGrid(year, month)
  const todayIso = isoDate(today)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const selectedEvents = selectedDate ? (eventsByDay[selectedDate] ?? []) : []

  return (
    <div className="flex flex-col h-full bg-cream-50">
      {/* Header */}
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-4 h-14 flex items-center">
        <h1 className="text-2xl font-bold text-wood-800 tracking-tight flex-1">{t.nav.calendario}</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Month nav + view toggle */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={prevMonth}
            className="size-9 flex items-center justify-center text-wood-600 hover:bg-cream-100 rounded-md transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-wood-800">
              {MONTH_LABELS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => {
                setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                setSelectedDate(null)
              }}
              className={[
                'size-8 flex items-center justify-center rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-honey-500 text-white'
                  : 'text-wood-400 hover:bg-cream-100',
              ].join(' ')}
              aria-label={viewMode === 'grid' ? 'Vista elenco' : 'Vista calendario'}
            >
              {viewMode === 'grid' ? <List size={18} /> : <Calendar size={18} />}
            </button>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="size-9 flex items-center justify-center text-wood-600 hover:bg-cream-100 rounded-md transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {viewMode === 'grid' ? (
          <>
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 px-2 mb-1">
              {DOW_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-wood-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="px-2">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-wood-400">{t.common.loading}</div>
              ) : (
                grid.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-7">
                    {row.map((day, ci) => {
                      if (day === 0) return <div key={ci} />
                      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const dayEvents = eventsByDay[iso] ?? []
                      const isToday = iso === todayIso
                      const isSelected = iso === selectedDate
                      const hasEvents = dayEvents.length > 0

                      return (
                        <button
                          key={ci}
                          type="button"
                          onClick={() => setSelectedDate(isSelected ? null : iso)}
                          className="flex flex-col items-center py-1.5 gap-0.5"
                        >
                          <span
                            className={[
                              'size-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors',
                              isSelected
                                ? 'bg-honey-500 text-white'
                                : isToday
                                ? 'bg-cream-200 text-wood-800 font-semibold'
                                : 'text-wood-700',
                            ].join(' ')}
                          >
                            {day}
                          </span>
                          {hasEvents && (
                            <span className="flex gap-0.5">
                              {dayEvents.slice(0, 3).map((ev, i) => (
                                <span
                                  key={i}
                                  className={`size-1 rounded-full ${
                                    ev.kind === 'treatment'
                                      ? (isSelected ? 'bg-amber-200' : 'bg-amber-500')
                                      : (isSelected ? 'bg-honey-200' : 'bg-honey-500')
                                  }`}
                                />
                              ))}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Selected day events */}
            {selectedDate && (
              <div className="px-4 mt-4">
                <p className="text-xs font-semibold text-wood-400 uppercase tracking-wider mb-2">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </p>
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-wood-400">Nessun evento</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {selectedEvents.map((ev) =>
                      ev.kind === 'inspection' ? (
                        <li key={`i-${ev.id}`}>
                          <Link
                            to="/hives/$hiveId/inspections/$inspectionId"
                            params={{ hiveId: ev.hiveId, inspectionId: ev.id }}
                            className="flex items-center justify-between bg-cream-100 border border-cream-200 rounded-xl px-4 py-3 active:bg-cream-200 transition-colors"
                          >
                            <div>
                              <p className="text-sm font-semibold text-wood-800">{ev.hiveIdentifier}</p>
                              <p className="text-xs text-honey-600">{ev.apiaryName}</p>
                              {ev.performerDisplayName && (
                                <p className="text-[11px] text-wood-400 mt-0.5">da {ev.performerDisplayName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-wood-400">{ev.time}</span>
                              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="text-wood-300">
                                <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </Link>
                        </li>
                      ) : (
                        <li key={`t-${ev.id}`}>
                          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <Syringe size={18} strokeWidth={1.75} className="text-amber-600 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-wood-800">{ev.productName}</p>
                              <p className="text-xs text-wood-500">{ev.apiaryName}</p>
                            </div>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── List view: all events this month, grouped by day ── */
          <div className="px-4">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-wood-400">{t.common.loading}</div>
            ) : Object.keys(eventsByDay).length === 0 ? (
              <div className="py-12 text-center text-sm text-wood-400">Nessun evento questo mese</div>
            ) : (
              Object.entries(eventsByDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dayIso, dayEvents]) => {
                  const d = new Date(dayIso + 'T12:00:00')
                  const dayLabel = d.toLocaleDateString('it-IT', {
                    weekday: 'short', day: 'numeric', month: 'long',
                  })
                  const isToday = dayIso === todayIso
                  return (
                    <div key={dayIso} className="mb-4">
                      <p className={[
                        'text-xs font-semibold uppercase tracking-wider mb-2',
                        isToday ? 'text-honey-600' : 'text-wood-400',
                      ].join(' ')}>
                        {dayLabel}
                      </p>
                      <ul className="flex flex-col gap-2">
                        {dayEvents.map((ev) =>
                          ev.kind === 'inspection' ? (
                            <li key={`i-${ev.id}`}>
                              <Link
                                to="/hives/$hiveId/inspections/$inspectionId"
                                params={{ hiveId: ev.hiveId, inspectionId: ev.id }}
                                className="flex items-center justify-between bg-white border border-cream-200 rounded-xl px-4 py-3 active:bg-cream-50 transition-colors shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-honey-600 min-w-[3rem]">{ev.time}</span>
                                  <div>
                                    <p className="text-sm font-semibold text-wood-800">{ev.hiveIdentifier}</p>
                                    <p className="text-xs text-wood-400">{ev.apiaryName}</p>
                                    {ev.performerDisplayName && (
                                      <p className="text-[11px] text-wood-300">da {ev.performerDisplayName}</p>
                                    )}
                                  </div>
                                </div>
                                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="text-wood-300 shrink-0">
                                  <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </Link>
                            </li>
                          ) : (
                            <li key={`t-${ev.id}`}>
                              <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
                                <Syringe size={18} strokeWidth={1.75} className="text-amber-600 shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-wood-800">{ev.productName}</p>
                                  <p className="text-xs text-wood-400">{ev.apiaryName}</p>
                                </div>
                              </div>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )
                })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
