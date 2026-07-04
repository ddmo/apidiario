import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Users, Activity, ClipboardList, TreePine,
  Hexagon, Syringe, TrendingUp, DollarSign, type LucideIcon,
} from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

// ── helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtUsd(v: number): string {
  if (v < 0.001) return '< $0.001'
  return `$${v.toFixed(3)}`
}

// ── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, accent, sub,
}: {
  icon: LucideIcon
  label: string
  value: number | string | null | undefined
  accent?: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 flex items-start gap-4">
      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${accent ?? 'bg-stone-100'}`}>
        <Icon size={20} strokeWidth={1.75} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-stone-800 tabular-nums leading-tight">
          {value != null ? (typeof value === 'number' ? value.toLocaleString('it-IT') : value) : '…'}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-stone-400">{sub}</p>}
      </div>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const { data: users } = useQuery({
    queryKey: ['admin', 'users-list'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('admin-list-users')
      return (data?.users ?? []) as Array<{ id: string; email: string; displayName: string; createdAt: string | null; lastSignInAt: string | null; isConfirmed: boolean; isAdmin: boolean }>
    },
    staleTime: 2 * 60 * 1000,
  })

  const { data: activeUsers } = useQuery({
    queryKey: ['admin', 'active-users'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_active_user_counts')
      return Array.isArray(data) ? data[0] : null
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: apiaryCount } = useQuery({
    queryKey: ['admin', 'apiaries'],
    queryFn: async () => {
      const { count } = await supabase.from('apiaries').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: hiveCount } = useQuery({
    queryKey: ['admin', 'hives'],
    queryFn: async () => {
      const { count } = await supabase.from('hives').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: inspectionCount } = useQuery({
    queryKey: ['admin', 'inspections'],
    queryFn: async () => {
      const { count } = await supabase.from('inspections').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: inspections30d } = useQuery({
    queryKey: ['admin', 'inspections-30d'],
    queryFn: async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const { count } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .gte('performed_at', cutoff.toISOString())
      return count ?? 0
    },
  })

  const { data: treatmentCount } = useQuery({
    queryKey: ['admin', 'treatments'],
    queryFn: async () => {
      const { count } = await supabase.from('treatments').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: weeklyRaw } = useQuery({
    queryKey: ['admin', 'weekly-inspections'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_weekly_inspection_counts', { weeks_back: 12 })
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })

  const weeklyData = (() => {
    if (!weeklyRaw) return []
    const map = new Map(weeklyRaw.map((r) => [r.week_start, r.count]))
    const weeks: { label: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const mon = new Date(d)
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = mon.toISOString().slice(0, 10)
      weeks.push({
        label: mon.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        count: Number(map.get(key) ?? 0),
      })
    }
    return weeks
  })()
  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1)

  const { data: userStats } = useQuery({
    queryKey: ['admin', 'user-activity'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_user_activity_stats')
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: apiCostByUser } = useQuery({
    queryKey: ['admin', 'api-cost-by-user'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_api_cost_by_user')
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  const totalApiCost = (apiCostByUser ?? []).reduce((s: number, r: { cost_usd?: number }) => s + (r.cost_usd ?? 0), 0)

  return (
    <div className="px-6 py-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Dashboard</h1>

      {/* ── Utenti ── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Utenti</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Users} label="Registrati" value={users?.length ?? null} accent="bg-amber-600" />
          <KpiCard icon={Activity} label="Attivi (7gg)" value={activeUsers?.active_7d ?? null} accent="bg-green-600" />
          <KpiCard icon={Activity} label="Attivi (30gg)" value={activeUsers?.active_30d ?? null} accent="bg-green-500" />
          <KpiCard
            icon={DollarSign}
            label="Costo API"
            value={apiCostByUser ? fmtUsd(totalApiCost) : null}
            accent="bg-stone-500"
          />
        </div>
      </section>

      {/* ── Dati app ── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Dati app</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={TreePine} label="Apiari" value={apiaryCount} accent="bg-amber-700" />
          <KpiCard icon={Hexagon} label="Arnie" value={hiveCount} accent="bg-amber-700" />
          <KpiCard icon={ClipboardList} label="Ispezioni (tot.)" value={inspectionCount} accent="bg-amber-800" />
          <KpiCard icon={ClipboardList} label="Ispezioni (30gg)" value={inspections30d} accent="bg-amber-600" />
        </div>
      </section>

      {/* ── Trend ispezioni ── */}
      {weeklyData.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp size={13} />
            Ispezioni settimanali (12 settimane)
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 px-5 pt-5 pb-4">
            <div className="flex items-end gap-1.5 h-32">
              {weeklyData.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full rounded-t bg-amber-500 transition-all"
                      style={{
                        height: `${Math.round((w.count / maxWeekly) * 100)}%`,
                        minHeight: w.count > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  {w.count > 0 && (
                    <span className="text-[10px] text-stone-500 tabular-nums leading-none">{w.count}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-2">
              {weeklyData.map((w, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[9px] text-stone-400 leading-none">{w.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trattamenti ── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Trattamenti</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Syringe} label="Trattamenti (tot.)" value={treatmentCount} accent="bg-stone-600" />
        </div>
      </section>

      {/* ── Per-user activity ── */}
      {userStats && userStats.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={13} />
            Attività per utente
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">Utente</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3">Ispezioni</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3 hidden sm:table-cell">Ultima ispezione</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3 hidden md:table-cell">Ultima attività</th>
                </tr>
              </thead>
              <tbody>
                {(userStats as Array<{ user_id: string; display_name: string; inspection_count: number; last_inspection_at: string | null; last_active_at: string | null }>).map((u, i, arr) => (
                  <tr key={u.user_id} className={i < arr.length - 1 ? 'border-b border-stone-100' : ''}>
                    <td className="px-4 py-3 font-medium text-stone-800 truncate max-w-[160px]">{u.display_name || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-600">{u.inspection_count}</td>
                    <td className="px-4 py-3 text-right text-xs text-stone-400 whitespace-nowrap hidden sm:table-cell">
                      {fmtDate(u.last_inspection_at)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-stone-400 whitespace-nowrap hidden md:table-cell">
                      {fmtDate(u.last_active_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── API cost by user ── */}
      {apiCostByUser && (apiCostByUser as Array<unknown>).length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <DollarSign size={13} />
            Costi API (piattaforma) · Totale: {fmtUsd(totalApiCost)}
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">Utente</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3">Chiamate</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3">Costo</th>
                </tr>
              </thead>
              <tbody>
                {(apiCostByUser as Array<{ user_id: string; display_name: string; call_count: number; cost_usd?: number }>).map((u, i, arr) => (
                  <tr key={u.user_id} className={i < arr.length - 1 ? 'border-b border-stone-100' : ''}>
                    <td className="px-4 py-3 font-medium text-stone-800 truncate max-w-[160px]">{u.display_name || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-600">{u.call_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-600 whitespace-nowrap">{fmtUsd(u.cost_usd ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
