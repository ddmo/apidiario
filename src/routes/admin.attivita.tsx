import { createFileRoute } from '@tanstack/react-router'
import { useActivityLog } from '@/features/admin/hooks/use-activity-log'

export const Route = createFileRoute('/admin/attivita')({
  component: AdminActivityLogPage,
})

const actionLabels: Record<string, string> = {
  insert: 'Inserimento',
  update: 'Modifica',
  delete: 'Eliminazione',
}

const actionColors: Record<string, string> = {
  insert: 'bg-green-100 text-green-700',
  delete: 'bg-red-100 text-red-600',
  update: 'bg-amber-100 text-amber-700',
}

const entityLabels: Record<string, string> = {
  apiary: 'apiario',
  hive: 'arnia',
  treatment: 'trattamento',
  bloom_observation: 'fioritura',
  inspection: 'ispezione',
}

function AdminActivityLogPage() {
  const { data: entries, isLoading, error } = useActivityLog()

  return (
    <div className="px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Log attività</h1>

      {isLoading && (
        <p className="text-sm text-stone-400 text-center py-12">Caricamento…</p>
      )}
      {error && (
        <p className="text-sm text-red-600 py-4">Errore nel caricamento del log.</p>
      )}

      {!isLoading && !error && entries && entries.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-12">Nessuna attività registrata.</p>
      )}

      {!isLoading && !error && entries && entries.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`px-4 py-3 ${i < entries.length - 1 ? 'border-b border-stone-100' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${actionColors[entry.action] ?? 'bg-stone-100 text-stone-500'}`}>
                  {actionLabels[entry.action] ?? entry.action}
                </span>
                <span className="text-xs text-stone-400">
                  {entityLabels[entry.entityType] ?? entry.entityType}
                </span>
              </div>
              <p className="text-sm text-stone-800">{entry.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                <span>{entry.displayName}</span>
                <span>·</span>
                <span>
                  {new Date(entry.createdAt).toLocaleString('it-IT', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
