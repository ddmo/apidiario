import { Syringe, ClipboardCheck, Hexagon, Trees, Edit3, Eye } from 'lucide-react'
import type { ApiaryListItem as ApiaryListItemData } from '../hooks/use-apiaries'
import type { AccessLevel, WeatherInfo } from '@/features/home/hooks/use-apiary-cards'

interface ApiaryListItemProps {
  apiary: ApiaryListItemData
  onClick: () => void
  lastInspectionAt?: string | null
  hasActiveTreatment?: boolean
  accessLevel?: AccessLevel
  ownerDisplayName?: string | null
  weather?: WeatherInfo | null
  photoUrl?: string | null
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'oggi'
  if (days === 1) return 'ieri'
  return `${days} g fa`
}

function WeatherIcon({ code }: { code: number }) {
  // WMO codes: 0=clear, 1-3=cloudy, 45-48=fog, 51-57=drizzle, 61-67=rain, 71-77=snow, 80-82=showers, 85-86=snow showers, 95-99=thunderstorm
  if (code === 0 || code === 1) return '☀️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code >= 45 && code <= 48) return '🌫️'
  if ((code >= 51 && code <= 57) || (code >= 80 && code <= 82)) return '🌦️'
  if (code >= 61 && code <= 67) return '🌧️'
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '🌨️'
  if (code >= 95) return '⛈️'
  return '☀️'
}

export function ApiaryListItem({ apiary, onClick, lastInspectionAt, hasActiveTreatment, accessLevel, ownerDisplayName, weather, photoUrl }: ApiaryListItemProps) {
  const { name, hiveCount } = apiary

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-cream-100 border border-cream-200 rounded-lg text-left transition-colors duration-150 hover:bg-cream-50 active:bg-cream-200 shadow-xs overflow-hidden"
      style={{ borderLeft: '3px solid #BA7517' }}
    >
      <div className="flex items-stretch">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="w-16 shrink-0 object-cover"
          />
        ) : (
          <div className="w-16 shrink-0 flex items-center justify-center bg-cream-200">
            <Trees size={20} className="text-wood-400" strokeWidth={1.5} />
          </div>
        )}
        <div className="flex-1 min-w-0 px-3.5 py-2.5">
          {/* Top row: name + badges | date */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-wood-800 truncate">{name}</span>
            {hasActiveTreatment && (
              <Syringe size={13} className="text-warning-600 shrink-0" />
            )}
            {lastInspectionAt && (
              <span className="text-[10px] text-wood-400 shrink-0 ml-auto flex items-center gap-1">
                <ClipboardCheck size={10} className="shrink-0" />
                {formatRelativeDate(lastInspectionAt)}
              </span>
            )}
          </div>

          {/* Owner info for shared apiaries */}
          {accessLevel && accessLevel !== 'owner' && (
            <div className="flex items-center gap-1 mt-0.5">
              {accessLevel === 'editor' ? (
                <Edit3 size={10} className="text-wood-400 shrink-0" />
              ) : (
                <Eye size={10} className="text-wood-400 shrink-0" />
              )}
              <span className="text-[10px] text-wood-400">di {ownerDisplayName ?? '—'}</span>
            </div>
          )}

          {/* Bottom row: weather | hive count */}
          <div className="flex items-center gap-2 mt-1">
            {weather ? (
              <span className="text-xs text-wood-500">
                <span>{WeatherIcon({ code: weather.code })}</span>
                {' '}{weather.label}, {weather.temp}°C
              </span>
            ) : (
              <span />
            )}
            <span className="text-xs text-wood-500 font-medium tabular-nums ml-auto flex items-center gap-1">
              <Hexagon size={10} className="shrink-0" />
              {hiveCount}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
