import type { HiveSuggestions } from '../hooks/use-apiary-suggestions'
import { SuggestionItem } from './suggestion-item'

interface HiveSuggestionCardProps {
  data: HiveSuggestions
}

function relativeDate(iso: string): string {
  const now = new Date()
  const then = new Date(iso)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thatDay = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const d = Math.round((today.getTime() - thatDay.getTime()) / 86_400_000)
  if (d === 0) return 'oggi'
  if (d === 1) return 'ieri'
  if (d < 7) return `${d} giorni fa`
  if (d < 14) return '1 settimana fa'
  if (d < 21) return '2 settimane fa'
  if (d < 30) return '3 settimane fa'
  if (d < 60) return '1 mese fa'
  return `${Math.floor(d / 30)} mesi fa`
}

const raceLabels: Record<string, string> = {
  ligustica: 'Ligustica',
  carnica: 'Carnica',
  buckfast: 'Buckfast',
  altro: 'Altro',
}

const typeLabels: Record<string, string> = {
  dadant_blatt: 'Dadant Blatt',
  langstroth: 'Langstroth',
  altro: 'Altro',
}

export function HiveSuggestionCard({ data }: HiveSuggestionCardProps) {
  const { hive, lastInspection, suggestions } = data

  return (
    <div className="bg-cream-100 border border-cream-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cream-200">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-wood-800">
            Arnia {hive.identifier}
          </h3>
          <span className="text-[11px] text-wood-500">
            {typeLabels[hive.hive_type] ?? hive.hive_type}
            {' · '}
            {raceLabels[hive.bee_race] ?? hive.bee_race}
          </span>
        </div>
        <p className="text-[12px] text-wood-400 mt-1">
          {lastInspection
            ? `Ultima ispezione: ${relativeDate(lastInspection.performed_at)}`
            : 'Mai ispezionata'}
        </p>
      </div>

      {/* Suggestions */}
      <div className="divide-y-0">
        {suggestions.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-wood-400">
            Tutto in ordine
          </div>
        ) : (
          suggestions.map((s) => <SuggestionItem key={s.id} suggestion={s} />)
        )}
      </div>
    </div>
  )
}
