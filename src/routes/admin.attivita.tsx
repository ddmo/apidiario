import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useActivityLog } from '@/features/admin/hooks/use-activity-log'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/admin/attivita')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
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
    <main className="min-h-dvh px-4 py-6">
      <div className="mb-6">
        <Link
          to="/piu"
          className="inline-flex items-center gap-1 text-sm text-wood-500 hover:text-wood-700"
        >
          <ArrowLeft size={16} />
          Indietro
        </Link>
      </div>
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-medium text-wood-800 mb-6">
          Attività
        </h1>

        {isLoading && (
          <p className="text-sm text-wood-400 text-center py-8">Caricamento…</p>
        )}

        {error && (
          <p className="text-sm text-danger-500 text-center py-8">Errore nel caricamento.</p>
        )}

        {!isLoading && !error && entries && entries.length === 0 && (
          <p className="text-sm text-wood-400 text-center py-8">Nessuna attività registrata.</p>
        )}

        {!isLoading && !error && entries && entries.length > 0 && (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
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
        )}
      </div>
    </main>
  )
}
