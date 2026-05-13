import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, TreePine, Hexagon, ClipboardList, Syringe, Users, HardDrive, Database, Mic } from 'lucide-react'
import { useState, useEffect } from 'react'

function fmtBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const v = bytes / Math.pow(1024, i)
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
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
    ;(supabase.rpc as any)('is_app_admin').then(({ data }: { data: boolean | null }) => setIsAdmin(!!data))
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
      return data as { total_size: number; total_files: number } | null
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

  const stats = [
    { icon: TreePine, label: 'Apiari', value: apiaryCount, color: 'text-honey-600' },
    { icon: Hexagon, label: 'Arnie', value: hiveCount, color: 'text-honey-600' },
    { icon: ClipboardList, label: 'Ispezioni', value: inspectionCount, color: 'text-honey-600' },
    { icon: Syringe, label: 'Trattamenti', value: treatmentCount, color: 'text-honey-600' },
  ]

  return (
    <main className="min-h-dvh px-4 py-6">
      <div className="mb-6">
        <Link to="/piu" className="inline-flex items-center gap-1 text-sm text-wood-500 hover:text-wood-700">
          <ArrowLeft size={16} />
          Più
        </Link>
      </div>
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-medium text-wood-800 mb-6">
          Statistiche
        </h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-lg border border-cream-200 bg-cream-100 px-4 py-4 flex flex-col items-center gap-2"
            >
              <Icon size={24} className={`${color} shrink-0`} />
              <span className="text-2xl font-semibold text-wood-800 tabular-nums">
                {value != null ? value.toLocaleString('it-IT') : '…'}
              </span>
              <span className="text-xs text-wood-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Media & Storage */}
        <h2 className="text-sm font-semibold text-wood-600 mb-3 uppercase tracking-wider">Media</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-lg border border-cream-200 bg-cream-100 px-4 py-4 flex flex-col items-center gap-2">
            <HardDrive size={24} className="text-wood-500 shrink-0" />
            <span className="text-2xl font-semibold text-wood-800 tabular-nums">
              {mediaCount != null ? mediaCount.toLocaleString('it-IT') : '…'}
            </span>
            <span className="text-xs text-wood-500">Foto / video</span>
          </div>
          <div className="rounded-lg border border-cream-200 bg-cream-100 px-4 py-4 flex flex-col items-center gap-2">
            <Mic size={24} className="text-wood-500 shrink-0" />
            <span className="text-2xl font-semibold text-wood-800 tabular-nums">
              {audioCount != null ? audioCount.toLocaleString('it-IT') : '…'}
            </span>
            <span className="text-xs text-wood-500">Note vocali</span>
          </div>
          <div className="col-span-2 rounded-lg border border-cream-200 bg-cream-100 px-4 py-4 flex items-center gap-4">
            <Database size={24} className="text-wood-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-wood-400">Spazio utilizzato (bucket)</p>
              <p className="text-xl font-semibold text-wood-800 tabular-nums">
                {storageUsage != null ? fmtBytes(storageUsage.total_size) : '…'}
              </p>
              {storageUsage != null && (
                <p className="text-xs text-wood-400">{storageUsage.total_files.toLocaleString('it-IT')} file</p>
              )}
            </div>
          </div>
        </div>

        {/* Users (admin only) */}
        {isAdmin && (
          <>
            <h2 className="text-sm font-semibold text-wood-600 mb-3 uppercase tracking-wider">Sistema</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-cream-200 bg-cream-100 px-4 py-4 flex flex-col items-center gap-2">
                <Users size={24} className="text-wood-500 shrink-0" />
                <span className="text-2xl font-semibold text-wood-800 tabular-nums">
                  {totalUsers != null ? totalUsers.toLocaleString('it-IT') : '…'}
                </span>
                <span className="text-xs text-wood-500">Utenti registrati</span>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-wood-400">Limite upload file: 20 MB per file</span>
          </div>
        </div>
      </div>
    </main>
  )
}
