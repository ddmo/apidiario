import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-guard'
import { ArrowLeft, TreePine, Hexagon, ClipboardList, Syringe, Cloud, HardDrive, Mic, Users, Activity, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'

function fmtBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3)
  const v = bytes / Math.pow(1024, i)
  return `${v.toFixed(i === 0 ? 0 : 1)} ${['B', 'KB', 'MB', 'GB'][i]}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ icon: Icon, label, value, accent, sub }: {
  icon: React.ComponentType<any>
  label: string
  value: number | null | undefined
  accent?: string
  sub?: string
}) {
  return (
    <div className="rounded-lg bg-cream-100 px-4 py-4 flex flex-col items-center gap-2">
      <Icon size={22} className={`${accent ?? 'text-wood-500'} shrink-0`} />
      <span className="text-2xl font-semibold text-wood-800 tabular-nums">
        {value != null ? value.toLocaleString('it-IT') : '…'}
      </span>
      <span className="text-xs text-wood-500 text-center">{label}</span>
      {sub && <span className="text-xs text-wood-400">{sub}</span>}
    </div>
  )
}

export const Route = createFileRoute('/statistiche')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: StatistichePage,
})

function StatistichePage() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.rpc('is_app_admin').then(({ data }) => setIsAdmin(!!data))
  }, [])

  // ── Aggregate counts ──────────────────────────────────────────
  const { data: apiaryCount } = useQuery({
    queryKey: ['stats', 'apiaries'],
    queryFn: async () => {
      const { count } = await supabase.from('apiaries').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: hiveCount } = useQuery({
    queryKey: ['stats', 'hives'],
    queryFn: async () => {
      const { count } = await supabase.from('hives').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: inspectionCount } = useQuery({
    queryKey: ['stats', 'inspections'],
    queryFn: async () => {
      const { count } = await supabase.from('inspections').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: treatmentCount } = useQuery({
    queryKey: ['stats', 'treatments'],
    queryFn: async () => {
      const { count } = await supabase.from('treatments').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: audioCount } = useQuery({
    queryKey: ['stats', 'audio'],
    queryFn: async () => {
      const { count } = await supabase.from('inspection_voice_notes').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: storageUsage } = useQuery({
    queryKey: ['stats', 'storage'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_storage_usage', { bucket_name: 'apidiario-media' })
      return (Array.isArray(data) ? data[0] : null) ?? null
    },
    staleTime: 2 * 60 * 1000,
  })

  const { data: mediaCount } = useQuery({
    queryKey: ['stats', 'media'],
    queryFn: async () => {
      const { count } = await supabase.from('inspection_media').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  // ── Admin-only: total users ───────────────────────────────────
  const { data: totalUsers } = useQuery({
    queryKey: ['stats', 'users'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('admin-list-users')
      return (data?.users?.length as number) ?? null
    },
    enabled: isAdmin,
  })

  // ── Admin-only: active user counts ───────────────────────────
  const { data: activeUsers } = useQuery({
    queryKey: ['stats', 'active-users'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_active_user_counts')
      return Array.isArray(data) ? data[0] : null
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  })

  // ── Admin-only: inspections last 30d ─────────────────────────
  const { data: recentInspections } = useQuery({
    queryKey: ['stats', 'inspections-30d'],
    queryFn: async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const { count } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .gte('performed_at', cutoff.toISOString())
      return count ?? 0
    },
    enabled: isAdmin,
  })

  // ── Admin-only: weekly trend ──────────────────────────────────
  const { data: weeklyRaw } = useQuery({
    queryKey: ['stats', 'weekly-inspections'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_weekly_inspection_counts', { weeks_back: 8 })
      return data ?? []
    },
    enabled: isAdmin,
    staleTime: 10 * 60 * 1000,
  })

  // Fill missing weeks with 0
  const weeklyData = (() => {
    if (!weeklyRaw) return []
    const map = new Map(weeklyRaw.map((r) => [r.week_start, r.count]))
    const weeks: { label: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const mon = new Date(d)
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday of that week
      const key = mon.toISOString().slice(0, 10)
      weeks.push({
        label: mon.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        count: Number(map.get(key) ?? 0),
      })
    }
    return weeks
  })()

  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1)

  // ── Admin-only: per-user stats ────────────────────────────────
  const { data: userStats } = useQuery({
    queryKey: ['stats', 'user-activity'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_user_activity_stats')
      return data ?? []
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <main className="min-h-dvh flex flex-col bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <Link
          to="/piu"
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </Link>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Statistiche
        </h1>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-8">

          {/* ── Dati globali ── */}
          <section>
            <h2 className="text-xs font-semibold text-wood-400 uppercase tracking-wider mb-3">Dati globali</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={TreePine} label="Apiari" value={apiaryCount} accent="text-honey-600" />
              <StatCard icon={Hexagon} label="Arnie" value={hiveCount} accent="text-honey-600" />
              <StatCard icon={ClipboardList} label="Ispezioni" value={inspectionCount} accent="text-honey-600" />
              <StatCard icon={Syringe} label="Trattamenti" value={treatmentCount} accent="text-honey-600" />
            </div>
          </section>

          {/* ── Storage ── */}
          <section>
            <h2 className="text-xs font-semibold text-wood-400 uppercase tracking-wider mb-3">Storage</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={HardDrive} label="Foto / video" value={mediaCount} />
              <StatCard icon={Mic} label="Note vocali" value={audioCount} />
              <div className="col-span-2 rounded-lg bg-cream-100 px-4 py-4 flex items-center gap-4">
                <Cloud size={22} className="text-wood-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-wood-800 tabular-nums">
                    {storageUsage != null ? fmtBytes(storageUsage.total_size) : '…'}
                  </p>
                  <p className="text-xs text-wood-400 tabular-nums">
                    {storageUsage != null ? `${storageUsage.total_files.toLocaleString('it-IT')} file` : ''}
                    {' · 20 MB max per file'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Admin: engagement ── */}
          {isAdmin && (
            <section>
              <h2 className="text-xs font-semibold text-wood-400 uppercase tracking-wider mb-3">Engagement</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Users} label="Utenti registrati" value={totalUsers} />
                <StatCard icon={ClipboardList} label="Ispezioni (30gg)" value={recentInspections} />
                <StatCard
                  icon={Activity}
                  label="Utenti attivi 7gg"
                  value={activeUsers?.active_7d ?? null}
                  accent="text-green-600"
                />
                <StatCard
                  icon={Activity}
                  label="Utenti attivi 30gg"
                  value={activeUsers?.active_30d ?? null}
                  accent="text-green-600"
                />
              </div>
            </section>
          )}

          {/* ── Admin: trend settimanale ── */}
          {isAdmin && weeklyData.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-wood-400 uppercase tracking-wider mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp size={13} />
                  Ispezioni per settimana
                </span>
              </h2>
              <div className="rounded-lg bg-cream-100 px-4 pt-4 pb-3">
                <div className="flex items-end gap-1.5 h-24">
                  {weeklyData.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full rounded-t bg-honey-500 transition-all"
                          style={{ height: `${Math.round((w.count / maxWeekly) * 100)}%`, minHeight: w.count > 0 ? '4px' : '0' }}
                        />
                      </div>
                      {w.count > 0 && (
                        <span className="text-[10px] text-wood-600 tabular-nums leading-none">{w.count}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {weeklyData.map((w, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[9px] text-wood-400 leading-none">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Admin: attività per utente ── */}
          {isAdmin && userStats && userStats.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-wood-400 uppercase tracking-wider mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} />
                  Attività per utente
                </span>
              </h2>
              <div className="rounded-lg bg-cream-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-200">
                      <th className="text-left text-xs font-semibold text-wood-400 px-4 py-2">Utente</th>
                      <th className="text-right text-xs font-semibold text-wood-400 px-3 py-2">Isp.</th>
                      <th className="text-right text-xs font-semibold text-wood-400 px-4 py-2">Ultima attività</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((u, i) => (
                      <tr key={u.user_id} className={i < userStats.length - 1 ? 'border-b border-cream-200' : ''}>
                        <td className="px-4 py-2.5 text-wood-800 font-medium truncate max-w-[140px]">{u.display_name}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-wood-600">{u.inspection_count}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-wood-400 whitespace-nowrap">{fmtDate(u.last_active_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  )
}
