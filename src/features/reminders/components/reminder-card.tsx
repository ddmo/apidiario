import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, Check, Trash2, Repeat, Globe, Trees, Hexagon } from 'lucide-react'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import type { ReminderListItem } from '../types'

interface ReminderCardProps {
  reminder: ReminderListItem
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}

const SCOPE_ICONS: Record<string, typeof Globe> = {
  global: Globe,
  apiary: Trees,
  hive: Hexagon,
}

const RECURRENCE_LABELS: Record<string, string> = {
  weekly: 'Ogni settimana',
  monthly: 'Ogni mese',
  yearly: 'Ogni anno',
}

function formatDate(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getScopeLabel(r: ReminderListItem): string {
  if (r.scope === 'hive') {
    const parts: string[] = []
    if (r.apiary_name) parts.push(r.apiary_name)
    if (r.hive_identifier) parts.push(r.hive_identifier)
    return parts.length > 0 ? parts.join(' - ') : 'Arnia'
  }
  if (r.scope === 'apiary') return r.apiary_name ?? 'Apiario'
  return 'Generale'
}

export function ReminderCard({ reminder, onComplete, onDelete }: ReminderCardProps) {
  const navigate = useNavigate()
  const now = new Date()
  const dueAt = new Date(reminder.due_at)
  const isOverdue = !reminder.completed_at && dueAt < now

  const ScopeIcon = SCOPE_ICONS[reminder.scope] ?? Globe

  function handleTap() {
    void navigate({
      to: '/promemoria/$reminderId/edit',
      params: { reminderId: reminder.id },
    })
  }

  return (
    <SwipeableRow
      revealWidth={168}
      revealContent={
        <div className="flex h-full">
          <button
            type="button"
            aria-label="Completa"
            onClick={() => onComplete(reminder.id)}
            className="flex flex-col items-center justify-center gap-0.5 w-[84px] h-full bg-success-500 text-cream-50 text-[10px] font-medium transition-colors"
          >
            <Check size={18} />
            Completa
          </button>
          <button
            type="button"
            aria-label="Elimina"
            onClick={() => onDelete(reminder.id)}
            className="flex flex-col items-center justify-center gap-0.5 w-[84px] h-full bg-danger-500 text-cream-50 text-[10px] font-medium transition-colors"
          >
            <Trash2 size={18} />
            Elimina
          </button>
        </div>
      }
    >
      <button
        type="button"
        onClick={handleTap}
        className="flex-1 flex flex-col gap-1 border border-cream-200 bg-cream-100 px-4 py-3 text-left hover:bg-cream-200 transition-colors"
        style={isOverdue ? { borderColor: 'var(--color-danger-100)' } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isOverdue && (
              <AlertCircle size={14} className="text-danger-500 shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium text-wood-800 truncate">{reminder.title}</p>
          </div>
          <span className={`text-xs font-medium shrink-0 ${isOverdue ? 'text-danger-500' : 'text-wood-400'}`}>
            {formatDate(reminder.due_at)}
          </span>
        </div>

        {reminder.description && (
          <p className="text-xs text-wood-500 leading-relaxed line-clamp-2">{reminder.description}</p>
        )}

        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-0.5 text-[10px] text-wood-400 font-medium">
            <ScopeIcon size={10} />
            {getScopeLabel(reminder)}
          </span>
          {reminder.recurrence !== 'none' && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-wood-400 bg-cream-50 rounded-full px-2 py-0.5 border border-cream-200">
              <Repeat size={10} />
              {RECURRENCE_LABELS[reminder.recurrence] ?? reminder.recurrence}
            </span>
          )}
        </div>
      </button>
    </SwipeableRow>
  )
}
