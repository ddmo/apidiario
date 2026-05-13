import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, TreePine, Hexagon, ClipboardList, Syringe, Users, HardDrive, Database } from 'lucide-react'
import { useState, useEffect } from 'react'

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
    { icon: HardDrive, label: 'Foto / video', value: mediaCount, color: 'text-wood-500' },
    ...(isAdmin ? [{ icon: Users, label: 'Utenti registrati', value: totalUsers, color: 'text-wood-500' }] : []),
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

        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-lg border border-cream-200 bg-cream-100 px-4 py-4 flex flex-col items-center gap-2"
            >
              <Icon size={24} className={`${color} shrink-0`} />
              <span className="text-2xl font-semibold text-wood-800 tabular-nums">
                {value !== undefined ? value.toLocaleString('it-IT') : '…'}
              </span>
              <span className="text-xs text-wood-500">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-cream-200 bg-cream-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-wood-500 shrink-0" />
            <div>
              <p className="text-xs text-wood-400">Limite upload file</p>
              <p className="text-sm font-medium text-wood-800">20 MB per file</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
