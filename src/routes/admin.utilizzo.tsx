import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { BarChart3, Users, Activity, TrendingUp } from 'lucide-react'
import { useAppUsage } from '@/features/admin/hooks/use-app-usage'
import { useProfilesList } from '@/features/admin/hooks/use-profiles-list'
import { actionLabels, actionBarColors, entityLabels, entityBarColors } from '@/features/admin/activity-labels'

export const Route = createFileRoute('/admin/utilizzo')({
  component: AdminUsagePage,
})

const RANGE_OPTIONS = [
  { days: 7, label: '7 giorni' },
  { days: 30, label: '30 giorni' },
  { days: 90, label: '90 giorni' },
]

function fmtNum(n: number): string {
  return n.toLocaleString('it-IT', { maximumFractionDigits: 1 })
}

// ── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, accent }: {
  icon: typeof Users
  label: string
  value: string | number | null
  accent: string
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 flex items-start gap-4">
      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={20} strokeWidth={1.75} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-stone-800 tabular-nums leading-tight">
          {value ?? '…'}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Horizontal breakdown bars ────────────────────────────────────────────────

function BreakdownList({ entries, total, labels, colors }: {
  entries: { key: string; count: number }[]
  total: number
  labels: Record<string, string>
  colors: Record<string, string>
}) {
  if (entries.length === 0) {
    return <p className="text-xs text-stone-400 py-2">Nessun dato nel periodo.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {entries.map((e) => {
        const pct = total > 0 ? Math.round((e.count / total) * 100) : 0
        return (
          <div key={e.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700">{labels[e.key] ?? e.key}</span>
              <span className="text-stone-500 tabular-nums">{e.count} · {pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors[e.key] ?? 'bg-stone-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

function AdminUsagePage() {
  const [days, setDays] = useState(30)
  const [userId, setUserId] = useState<string | null>(null)

  const { data: profiles } = useProfilesList()
  const { data: usage, isLoading, error } = useAppUsage(days, userId)

  const maxDaily = Math.max(...(usage?.daily.map((d) => d.count) ?? [0]), 1)
  const labelEvery = days <= 7 ? 1 : days <= 30 ? 5 : 10

  const selectedUserName = userId ? profiles?.find((p) => p.id === userId)?.display_name : null

  return (
    <div className="px-6 py-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Utilizzo app</h1>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center rounded-lg border border-stone-200 bg-white p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setDays(opt.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                days === opt.days ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={userId ?? 'all'}
          onChange={(e) => setUserId(e.target.value === 'all' ? null : e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
        >
          <option value="all">Tutti gli utenti</option>
          {(profiles ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.display_name}</option>
          ))}
        </select>

        {userId && (
          <button
            type="button"
            onClick={() => setUserId(null)}
            className="text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2"
          >
            Rimuovi filtro utente
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
          Errore nel caricamento dei dati di utilizzo.
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <KpiCard
          icon={Activity}
          label={`Eventi (${days}gg)${selectedUserName ? ` · ${selectedUserName}` : ''}`}
          value={usage ? usage.totalEvents : null}
          accent="bg-amber-600"
        />
        <KpiCard
          icon={Users}
          label="Utenti attivi nel periodo"
          value={usage ? usage.activeUserCount : null}
          accent="bg-green-600"
        />
        <KpiCard
          icon={TrendingUp}
          label="Media eventi/giorno"
          value={usage ? fmtNum(usage.avgPerDay) : null}
          accent="bg-stone-500"
        />
      </div>

      {/* ── Daily trend ── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <BarChart3 size={13} />
          Trend giornaliero
        </h2>
        <div className="bg-white rounded-xl border border-stone-200 px-5 pt-5 pb-4 overflow-x-auto">
          {isLoading && <p className="text-sm text-stone-400 text-center py-12">Caricamento…</p>}
          {!isLoading && usage && (
            <>
              <div className="flex items-end gap-1 h-36" style={{ minWidth: days > 30 ? `${days * 8}px` : undefined }}>
                {usage.daily.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full" title={`${d.label}: ${d.count} eventi`}>
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t bg-amber-500 transition-all"
                        style={{
                          height: `${Math.round((d.count / maxDaily) * 100)}%`,
                          minHeight: d.count > 0 ? '3px' : '0',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                {usage.daily.map((d, i) => (
                  <div key={d.date} className="flex-1 text-center">
                    {i % labelEvery === 0 && (
                      <span className="text-[9px] text-stone-400 leading-none">{d.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Breakdown ── */}
      {usage && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <section>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Per tipo di dato</h2>
            <div className="bg-white rounded-xl border border-stone-200 px-5 py-5">
              <BreakdownList entries={usage.byEntityType} total={usage.totalEvents} labels={entityLabels} colors={entityBarColors} />
            </div>
          </section>
          <section>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Per azione</h2>
            <div className="bg-white rounded-xl border border-stone-200 px-5 py-5">
              <BreakdownList entries={usage.byAction} total={usage.totalEvents} labels={actionLabels} colors={actionBarColors} />
            </div>
          </section>
        </div>
      )}

      {/* ── Leaderboard (only when viewing all users) ── */}
      {!userId && usage && usage.byUser.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={13} />
            Utenti più attivi nel periodo
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">Utente</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3">Eventi</th>
                </tr>
              </thead>
              <tbody>
                {usage.byUser.slice(0, 15).map((u, i, arr) => (
                  <tr
                    key={u.userId}
                    className={`cursor-pointer hover:bg-stone-50 ${i < arr.length - 1 ? 'border-b border-stone-100' : ''}`}
                    onClick={() => setUserId(u.userId)}
                  >
                    <td className="px-4 py-3 font-medium text-stone-800 truncate max-w-[220px]">{u.displayName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-600">{u.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">Clicca una riga per filtrare su quell'utente.</p>
        </section>
      )}
    </div>
  )
}
