import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useActivityLog } from '@/features/admin/hooks/use-activity-log'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/admin/attivita')({
  beforeLoad: async () => {
    let user = null
    let isAdmin = false
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
      if (user) {
        const { data: adminData } = await supabase.rpc('is_app_admin')
        isAdmin = adminData ?? false
      }
    } catch {
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user ?? null
    }
    if (!user) throw redirect({ to: '/login' })
    if (!isAdmin) throw redirect({ to: '/' })
  },
  component: AdminActivityLogPage,
})

const actionLabels: Record<string, string> = {
  insert: 'Inserimento',
  update: 'Modifica',
  delete: 'Eliminazione',
}

const entityLabels: Record<string, string> = {
  apiary: 'apiario',
  hive: 'arnia',
  treatment: 'trattamento',
  bloom_observation: 'osservazione fioritura',
  inspection: 'ispezione',
}

function AdminActivityLogPage() {
  const { data: entries, isLoading, error } = useActivityLog()

  return (
    <div className="fixed inset-0 bg-cream-50 flex flex-col z-10">
      <header className="shrink-0 bg-cream-50/95 backdrop-blur-sm border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <Link
          to="/piu"
          aria-label="Indietro"
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </Link>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Attività
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          {isLoading && (
            <p className="text-sm text-wood-400 text-center py-8">Caricamento…</p>
          )}

          {error && (
            <p className="text-sm text-danger-500 text-center py-8">Errore nel caricamento.</p>
          )}

          {!isLoading && !error && entries && entries.length === 0 && (
            <p className="text-sm text-wood-400 text-center py-8">Nessuna attività registrata.</p>
          )}

          {!isLoading && !error && entries?.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-cream-200 bg-cream-100 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  entry.action === 'insert'
                    ? 'bg-green-100 text-green-700'
                    : entry.action === 'delete'
                      ? 'bg-danger-100 text-danger-500'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {actionLabels[entry.action] ?? entry.action}
                </span>
                <span className="text-xs text-wood-400">
                  {entityLabels[entry.entityType] ?? entry.entityType}
                </span>
              </div>
              <p className="text-sm text-wood-800">{entry.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-wood-400">
                <span>{entry.displayName}</span>
                <span>&middot;</span>
                <span>
                  {new Date(entry.createdAt).toLocaleString('it-IT', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
