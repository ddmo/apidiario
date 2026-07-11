import { Wind } from 'lucide-react'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { useWeatherForecast, type ForecastDay } from '@/features/weather/hooks/use-weather-forecast'
import { WeatherIcon } from './weather-icon'

function scoreColor(score: number): string {
  switch (score) {
    case 3: return 'bg-success-100 text-success-500'
    case 2: return 'bg-cream-200 text-wood-600'
    case 1: return 'bg-warning-100 text-warning-500'
    default: return 'bg-danger-100 text-danger-500'
  }
}

function scoreLabel(score: number): string {
  switch (score) {
    case 3: return 'Ideale'
    case 2: return 'OK'
    case 1: return 'Scarso'
    default: return 'No'
  }
}

function DayRow({ day, isToday, allTmin, range }: { day: ForecastDay; isToday: boolean; allTmin: number; range: number }) {
  const leftPct = ((day.tmin - allTmin) / range) * 100
  const widthPct = ((day.tmax - day.tmin) / range) * 100
  const precipColor = day.precip_prob == null ? 'text-wood-400' : day.precip_prob >= 50 ? 'text-honey-600' : day.precip_prob > 0 ? 'text-wood-500' : 'text-wood-400'

  const label = isToday
    ? 'Oggi'
    : new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })

  return (
    <div className="grid items-center gap-2.5 py-2.5 px-4 text-xs border-b border-cream-200/60 last:border-b-0" style={{ gridTemplateColumns: '56px 24px 30px 1fr 34px 64px' }}>
      <span className={`truncate ${isToday ? 'font-medium text-wood-800' : 'text-wood-700'}`}>
        {label}
      </span>
      <div className="justify-self-center">
        <WeatherIcon category={day.weather.category} color={day.weather.color} />
      </div>
      <span className={`text-xs text-right tabular-nums ${precipColor}`}>
        {day.precip_prob != null ? `${day.precip_prob}%` : '—'}
      </span>
      <div className="relative h-[5px] bg-cream-200 rounded-sm">
        <div
          className="absolute h-[5px] bg-honey-500 rounded-sm"
          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 5)}%` }}
        />
      </div>
      <span className="text-xs text-wood-500 text-right tabular-nums flex items-center justify-end gap-0.5">
        <Wind size={11} strokeWidth={1.75} className="shrink-0" />
        {day.wind_max}
      </span>
      <div className="flex justify-between text-[12px] tabular-nums">
        <span className="text-wood-500">{day.tmin}°</span>
        <span className="text-wood-800 font-medium">{day.tmax}°</span>
      </div>
    </div>
  )
}

/** Card previsioni meteo per un apiario — riusata dalla route /meteo e dal pannello preview desktop. */
export function ForecastCard({ apiaryId }: { apiaryId: string }) {
  const { data: apiary } = useApiary(apiaryId)
  const { data: forecast, isLoading } = useWeatherForecast(
    apiary?.latitude ?? null,
    apiary?.longitude ?? null,
  )

  if (isLoading || !forecast) {
    return <div className="flex items-center justify-center py-12 text-sm text-wood-400">Caricamento previsioni…</div>
  }

  const allTmin = Math.min(...forecast.days.map((d) => d.tmin))
  const allTmax = Math.max(...forecast.days.map((d) => d.tmax))
  const range = allTmax - allTmin || 1

  return (
    <div className="bg-cream-100 border border-cream-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-cream-200 flex justify-between items-center">
        <div>
          <p className="text-[15px] font-medium text-wood-800">{apiary?.name}</p>
          <p className="text-[12px] text-wood-500 mt-0.5">
            {apiary?.address ? `${apiary.address} · ` : ''}
            {forecast.elevation != null ? `${forecast.elevation}m s.l.m.` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-wood-400 uppercase tracking-wider">Ora</p>
          <p className="text-xl font-medium text-wood-800 mt-0.5 flex items-center gap-1.5">
            <WeatherIcon category={forecast.current.weather.category} color={forecast.current.weather.color} size={22} />
            {forecast.current.temperature}°
          </p>
        </div>
      </div>

      <div className="py-1">
        {forecast.days.map((day, i) => (
          <DayRow key={day.date} day={day} isToday={i === 0} allTmin={allTmin} range={range} />
        ))}
      </div>

      <div className="border-t border-cream-200 px-4 py-3">
        <h3 className="text-xs font-medium text-wood-700 mb-2.5">Valutazione apistica</h3>
        <div className="space-y-2">
          {forecast.days.slice(0, 7).map((day) => {
            const label = new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })
            return (
              <div key={day.date} className="grid items-start text-[12px]" style={{ gridTemplateColumns: '36px 56px 1fr', gap: '10px' }}>
                <span className="text-wood-500 text-right">{label.split(' ')[0]}</span>
                <span className={`text-center px-1.5 py-0.5 rounded text-xs leading-none font-medium ${scoreColor(day.beekeeping.inspection_score)}`}>
                  {scoreLabel(day.beekeeping.inspection_score)}
                </span>
                <span className="text-wood-500">
                  {day.beekeeping.reasons.join(' · ')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-cream-200 text-xs text-wood-400 flex justify-between items-center">
        <span>Open-Meteo · ECMWF</span>
        <span>
          {(() => {
            const mins = Math.round((Date.now() - forecast.fetchedAt) / 60000)
            return mins < 1 ? 'aggiornato ora' : `aggiornato ${mins} min fa`
          })()}
        </span>
      </div>
    </div>
  )
}
