import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Wind } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApiary } from '@/features/apiaries/hooks/use-apiaries'
import { useWeatherForecast, type ForecastDay } from '@/features/weather/hooks/use-weather-forecast'

export const Route = createFileRoute('/apiaries/$apiaryId/meteo')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: MeteoPage,
})

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
  const precipColor = day.precip_prob >= 50 ? 'text-honey-600' : day.precip_prob > 0 ? 'text-wood-500' : 'text-wood-400'

  const label = isToday
    ? 'Oggi'
    : new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })

  return (
    <div className="grid items-center gap-2.5 py-2.5 px-4 text-[13px] border-b border-cream-200/60 last:border-b-0" style={{ gridTemplateColumns: '56px 24px 30px 1fr 34px 64px' }}>
      {/* Label */}
      <span className={`truncate ${isToday ? 'font-medium text-wood-800' : 'text-wood-700'}`}>
        {label}
      </span>

      {/* Icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={day.weather.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="justify-self-center">
        {day.weather.category === 'clear' && (
          <>
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </>
        )}
        {day.weather.category === 'cloudy' && (
          <>
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            {day.weather.code >= 2 && <path d="M18 10a5 5 0 0 0 0-10" opacity="0.3" />}
          </>
        )}
        {(day.weather.category === 'rain' || day.weather.category === 'drizzle') && (
          <>
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            <line x1="8" y1="19" x2="8" y2="21" /><line x1="8" y1="13" x2="8" y2="15" />
            <line x1="16" y1="19" x2="16" y2="21" /><line x1="16" y1="13" x2="16" y2="15" />
            <line x1="12" y1="21" x2="12" y2="23" /><line x1="12" y1="15" x2="12" y2="17" />
          </>
        )}
        {day.weather.category === 'fog' && (
          <>
            <line x1="2" y1="12" x2="22" y2="12" /><line x1="5" y1="8" x2="19" y2="8" />
            <line x1="3" y1="16" x2="21" y2="16" /><line x1="8" y1="20" x2="16" y2="20" />
          </>
        )}
        {day.weather.category === 'snow' && (
          <>
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            <path d="M12 10l-3 3h6l-3-3z" fill={day.weather.color} opacity="0.3" />
          </>
        )}
        {day.weather.category === 'thunderstorm' && (
          <>
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            <line x1="8" y1="19" x2="8" y2="21" /><line x1="16" y1="19" x2="16" y2="21" />
          </>
        )}
      </svg>

      {/* Precip probability */}
      <span className={`text-[11px] text-right tabular-nums ${precipColor}`}>
        {day.precip_prob}%
      </span>

      {/* Temp bar */}
      <div className="relative h-[5px] bg-cream-200 rounded-sm">
        <div
          className="absolute h-[5px] bg-honey-500 rounded-sm"
          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 5)}%` }}
        />
      </div>

      {/* Wind */}
      <span className="text-[11px] text-wood-500 text-right tabular-nums flex items-center justify-end gap-0.5">
        <Wind size={11} strokeWidth={1.75} className="shrink-0" />
        {day.wind_max}
      </span>

      {/* Temps */}
      <div className="flex justify-between text-[12px] tabular-nums">
        <span className="text-wood-500">{day.tmin}°</span>
        <span className="text-wood-800 font-medium">{day.tmax}°</span>
      </div>
    </div>
  )
}

function MeteoPage() {
  const { apiaryId } = Route.useParams()
  const router = useRouter()
  const { data: apiary } = useApiary(apiaryId)
  const { data: forecast, dataUpdatedAt, isLoading } = useWeatherForecast(
    apiary?.latitude ?? null,
    apiary?.longitude ?? null,
  )

  if (!apiary) {
    return (
      <main className="h-dvh flex flex-col bg-cream-50">
        <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
          <button
            type="button"
            aria-label="Indietro"
            onClick={() => router.history.back()}
            className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            <ArrowLeft size={22} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold text-wood-800 flex-1 px-1">Meteo</h1>
        </header>
        <div className="flex-1 flex items-center justify-center text-sm text-wood-400">Caricamento…</div>
      </main>
    )
  }

  const allTmin = forecast ? Math.min(...forecast.days.map((d) => d.tmin)) : 0
  const allTmax = forecast ? Math.max(...forecast.days.map((d) => d.tmax)) : 30
  const range = allTmax - allTmin || 1

  return (
    <main className="h-dvh flex flex-col bg-cream-50">
      {/* Header */}
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => router.history.back()}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-base font-semibold text-wood-800 tracking-tight flex-1 px-1">
          Meteo {apiary.name}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-sm text-wood-400">Caricamento previsioni…</div>
          )}

          {forecast && (
            <div className="bg-cream-100 border border-cream-200 rounded-xl overflow-hidden">
              {/* Current weather + location header */}
              <div className="px-4 py-3.5 border-b border-cream-200 flex justify-between items-center">
                <div>
                  <p className="text-[15px] font-medium text-wood-800">{apiary.name}</p>
                  <p className="text-[12px] text-wood-500 mt-0.5">
                    {apiary.address ? `${apiary.address} · ` : ''}
                    {forecast.elevation != null ? `${forecast.elevation}m s.l.m.` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-wood-400 uppercase tracking-wider">Ora</p>
                  <p className="text-xl font-medium text-wood-800 mt-0.5 flex items-center gap-1.5">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={forecast.current.weather.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      {forecast.current.weather.category === 'clear' && (
                        <>
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </>
                      )}
                      {forecast.current.weather.category === 'cloudy' && (
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                      )}
                      {(forecast.current.weather.category === 'rain' || forecast.current.weather.category === 'drizzle') && (
                        <>
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                          <line x1="8" y1="19" x2="8" y2="21" /><line x1="8" y1="13" x2="8" y2="15" />
                          <line x1="16" y1="19" x2="16" y2="21" /><line x1="16" y1="13" x2="16" y2="15" />
                        </>
                      )}
                      {forecast.current.weather.category === 'fog' && (
                        <>
                          <line x1="2" y1="12" x2="22" y2="12" /><line x1="5" y1="8" x2="19" y2="8" />
                          <line x1="3" y1="16" x2="21" y2="16" />
                        </>
                      )}
                      {forecast.current.weather.category === 'thunderstorm' && (
                        <>
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </>
                      )}
                      {forecast.current.weather.category === 'snow' && (
                        <>
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                          <path d="M12 10l-3 3h6l-3-3z" fill={forecast.current.weather.color} opacity="0.3" />
                        </>
                      )}
                    </svg>
                    {forecast.current.temperature}°
                  </p>
                </div>
              </div>

              {/* Forecast days */}
              <div className="py-1">
                {forecast.days.map((day, i) => (
                  <DayRow
                    key={day.date}
                    day={day}
                    isToday={i === 0}
                    allTmin={allTmin}
                    range={range}
                  />
                ))}
              </div>

              {/* Beekeeping assessment */}
              <div className="border-t border-cream-200 px-4 py-3">
                <h3 className="text-[13px] font-medium text-wood-700 mb-2.5">Valutazione apistica</h3>
                <div className="space-y-2">
                  {forecast.days.slice(0, 7).map((day) => {
                    const label = new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })
                    return (
                      <div key={day.date} className="grid items-start text-[12px]" style={{ gridTemplateColumns: '36px 56px 1fr', gap: '10px' }}>
                        <span className="text-wood-500 text-right">{label.split(' ')[0]}</span>
                        <span className={`text-center px-1.5 py-0.5 rounded text-[11px] leading-none font-medium ${scoreColor(day.beekeeping.inspection_score)}`}>
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

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-cream-200 text-[11px] text-wood-400 flex justify-between items-center">
                <span>Open-Meteo · ECMWF</span>
                <span>
                  {(() => {
                    const mins = Math.round((Date.now() - dataUpdatedAt) / 60000)
                    return mins < 1 ? 'aggiornato ora' : `aggiornato ${mins} min fa`
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
