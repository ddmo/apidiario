import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { getLastSyncAt } from '@/lib/query-client'
import { offlineQueue } from '@/lib/offline-queue'

function formatSyncTime(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return `oggi ${time}`
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ` ${time}`
}

export function SyncIndicator() {
  const online = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  // Aggiorna contatore ogni volta che la queue cambia
  useEffect(() => {
    const refresh = () => { void offlineQueue.count().then(setPendingCount) }
    refresh()
    window.addEventListener('offline-queue-changed', refresh)
    return () => window.removeEventListener('offline-queue-changed', refresh)
  }, [])

  // Ascolta stato sync
  useEffect(() => {
    const handler = (e: Event) => {
      setSyncing((e as CustomEvent<{ syncing: boolean }>).detail.syncing)
    }
    window.addEventListener('sync-state-changed', handler)
    return () => window.removeEventListener('sync-state-changed', handler)
  }, [])

  // Mostra solo se offline o se ci sono pending da sincronizzare
  const showOffline = !online
  const showSyncing = online && syncing
  const showPending = online && !syncing && pendingCount > 0

  if (!showOffline && !showSyncing && !showPending) return null

  const lastSync = getLastSyncAt()

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm
        ${showOffline ? 'bg-wood-800/90 text-cream-100' : 'bg-honey-500/90 text-wood-900'}`}
      >
        {showOffline && (
          <>
            <WifiOff size={11} aria-hidden="true" />
            <span>
              {pendingCount > 0
                ? `Offline — ${pendingCount} in sospeso`
                : lastSync
                  ? `Offline — dati al ${formatSyncTime(lastSync)}`
                  : 'Offline'}
            </span>
          </>
        )}
        {showSyncing && (
          <>
            <RefreshCw size={11} className="animate-spin" aria-hidden="true" />
            <span>Sincronizzazione…</span>
          </>
        )}
        {showPending && (
          <>
            <RefreshCw size={11} aria-hidden="true" />
            <span>{pendingCount} in attesa di sincronizzazione</span>
          </>
        )}
      </div>
    </div>
  )
}
