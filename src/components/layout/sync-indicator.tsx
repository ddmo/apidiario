import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { getLastSyncAt } from '@/lib/query-client'

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

  if (online) return null

  const lastSync = getLastSyncAt()

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center gap-1.5 bg-wood-800/90 text-cream-100 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
        <WifiOff size={11} aria-hidden="true" />
        <span>
          {lastSync ? `Offline — dati al ${formatSyncTime(lastSync)}` : 'Offline'}
        </span>
      </div>
    </div>
  )
}
