import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, TreePine, Hexagon, ClipboardList, Syringe, Cloud, HardDrive, Mic } from 'lucide-react'
import { useState, useEffect } from 'react'

function fmtBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3)
  const v = bytes / Math.pow(1024, i)
  return `${v.toFixed(i === 0 ? 0 : 1)} ${['B', 'KB', 'MB', 'GB'][i]}`
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<any>; label: string; value: number | null | undefined; accent?: string }) {
  return (
    <div className="rounded-lg bg-cream-100 px-4 py-4 flex flex-col items-center gap-2">
      <Icon size={22} className={`${accent ?? 'text-wood-500'} shrink-0`} />
      <span className="text-2xl font-semibold text-wood-800 tabular-nums">{value != null ? value.toLocaleString('it-IT') : '…'}</span>
      <span className="text-xs text-wood-500">{label}</span>
    </div>
  )
}

export const Route = createFileRoute('/statistiche')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: StatistichePage,
})

function StatistichePage() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.rpc('is_app_admin').then(({ data }) => setIsAdmin(!!data))
  }, [])

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
      const { data } = await (supabase.rpc as any)('get_storage_usage', { bucket_name: 'apidiario-media' })
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

  const { data: totalUsers } = useQuery({
    queryKey: ['stats', 'users'],
    queryFn: async () => {
      if (!isAdmin) return null
      const { data } = await supabase.functions.invoke('admin-list-users')
      return (data?.users?.length as number) ?? null
    },
    enabled: isAdmin,
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
        <div className="max-w-lg mx-auto">

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={TreePine} label="Apiari" value={apiaryCount} accent="text-honey-600" />
          <StatCard icon={Hexagon} label="Arnie" value={hiveCount} accent="text-honey-600" />
          <StatCard icon={ClipboardList} label="Ispezioni" value={inspectionCount} accent="text-honey-600" />
          <StatCard icon={Syringe} label="Trattamenti" value={treatmentCount} accent="text-honey-600" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
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

        {isAdmin && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Cloud} label="Utenti registrati" value={totalUsers} />
          </div>
        )}

      </div>
      </div>
    </main>
  )
}
