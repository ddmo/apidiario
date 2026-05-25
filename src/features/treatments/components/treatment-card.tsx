import { Syringe, Lock } from 'lucide-react'
import type { TreatmentListItem } from '../hooks/use-treatments'

function formatDateRange(start: string, end: string | null): string {
  const startDate = new Date(start)
  const startStr = startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  if (!end) return `${startStr} - in corso`
  const endDate = new Date(end)
  if (start === end) return startStr
  const endStr = endDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} - ${endStr}`
}

interface TreatmentCardProps {
  treatment: TreatmentListItem
}

export function TreatmentCard({ treatment }: TreatmentCardProps) {
  return (
    <div className="w-full bg-cream-100 border border-cream-200 px-4 py-3 text-left">
      <div className="flex items-center gap-2 mb-1">
        <Syringe size={16} strokeWidth={1.75} className="text-honey-600 shrink-0" />
        <span className="font-semibold text-wood-800 text-sm truncate">{treatment.productName}</span>
        {treatment.blocksMelari && (
          <Lock size={12} strokeWidth={2} className="text-danger-500 shrink-0" />
        )}
      </div>
      {treatment.performerName && (
        <p className="text-[11px] text-wood-400 mb-1">Eseguito da {treatment.performerName}</p>
      )}
      <p className="text-xs text-wood-500 mb-1">{formatDateRange(treatment.startDate, treatment.endDate)}</p>
      <p className="text-xs text-wood-400">
        {treatment.apiaryName}
        {!treatment.appliesToAllHives && treatment.hiveCount > 0 && (
          <span> · {treatment.hiveCount} arn{ treatment.hiveCount === 1 ? 'ia' : 'ie'}</span>
        )}
        {treatment.appliesToAllHives && (
          <span> · Tutto l&rsquo;apiario</span>
        )}
      </p>
    </div>
  )
}
