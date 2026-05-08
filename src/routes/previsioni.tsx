import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Flower2, ChevronDown } from 'lucide-react'
import {
  usePhenologySpecies,
  useWeatherData,
  useBloomPredictions,
} from '@/features/phenology/hooks/use-phenology'

export const Route = createFileRoute('/previsioni')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: PrevisioniPage,
})

type ApiaryOption = { id: string; name: string; latitude: number; longitude: number }

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'pre': return 'Pre-fioritura'
    case 'start': return 'Inizio fioritura'
    case 'peak': return 'Picco fioritura'
    case 'post': return 'Post-fioritura'
    default: return phase
  }
}

function phaseColor(phase: string): string {
  switch (phase) {
    case 'pre': return 'bg-cream-200 text-wood-500'
    case 'start': return 'bg-green-100 text-green-700'
    case 'peak': return 'bg-honey-200 text-honey-800'
    case 'post': return 'bg-wood-200 text-wood-600'
    default: return 'bg-cream-100 text-wood-400'
  }
}

function gddProgressPct(gdd: number, start: number, end: number): number {
  return Math.min(100, Math.max(0, ((gdd - start) / (end - start)) * 100))
}

function PrevisioniPage() {
  const { session } = useAuth()
  const [selectedApiaryId, setSelectedApiaryId] = useState<string | null>(null)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null)
  const [showApiaryPicker, setShowApiaryPicker] = useState(false)
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false)
  const [forecastLat, setForecastLat] = useState<number | null>(null)
  const [forecastLng, setForecastLng] = useState<number | null>(null)
  const [year] = useState(() => new Date().getFullYear())

  const { data: apiaries = [] } = useQuery({
    queryKey: ['apiaries-with-coords'],
    queryFn: async (): Promise<ApiaryOption[]> => {
      const { data, error } = await supabase
        .from('apiaries')
        .select('id, name, latitude, longitude')
        .is('archived_at', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('name')
      if (error) throw error
      return (data ?? []) as unknown as ApiaryOption[]
    },
    enabled: !!session?.user?.id,
  })

  const selectedApiary = useMemo(
    () => apiaries.find((a) => a.id === selectedApiaryId) ?? null,
    [apiaries, selectedApiaryId],
  )

  const { data: species = [] } = usePhenologySpecies()
  const { data: weather, isLoading: weatherLoading } = useWeatherData(forecastLat, forecastLng, year)
  const predictions = useBloomPredictions(weather, species)

  const selectedPrediction = selectedSpeciesId
    ? predictions.find((p) => p.species_id === selectedSpeciesId) ?? null
    : null

  const selectedSpecies = selectedSpeciesId
    ? species.find((s) => s.id === selectedSpeciesId) ?? null
    : null

  return (
    <main className="min-h-dvh flex flex-col bg-cream-50">
      {/* Header */}
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <Link
          to="/piu"
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </Link>
        <h1 className="text-base font-semibold text-wood-800 tracking-tight flex-1 px-1">
          Previsioni fioriture
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {/* Apiary selector */}
          <div className="relative">
            <label className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-1.5 block">
              Apiario
            </label>
            <button
              type="button"
              onClick={() => setShowApiaryPicker((v) => !v)}
              className="w-full flex items-center justify-between gap-2 bg-cream-100 border border-cream-200 rounded-lg px-4 py-3 text-sm text-wood-700 hover:border-wood-300 transition-colors"
            >
              <span className={selectedApiary ? 'text-wood-800' : 'text-wood-400'}>
                {selectedApiary?.name ?? 'Seleziona apiario…'}
              </span>
              <ChevronDown size={16} className="text-wood-400 shrink-0" />
            </button>
            {showApiaryPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowApiaryPicker(false)} />
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-cream-50 border border-cream-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {apiaries.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-wood-400">
                      Nessun apiario con posizione impostata.
                    </p>
                  ) : (
                    apiaries.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setSelectedApiaryId(a.id); setShowApiaryPicker(false); setSelectedSpeciesId(null); setForecastLat(null); setForecastLng(null) }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-cream-100 transition-colors ${
                          a.id === selectedApiaryId ? 'bg-cream-100 font-medium text-wood-800' : 'text-wood-600'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin size={13} className="text-honey-500 shrink-0" />
                          {a.name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Species selector */}
          <div className="relative">
            <label className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-1.5 block">
              Pianta
            </label>
            <button
              type="button"
              onClick={() => setShowSpeciesPicker((v) => !v)}
              disabled={!selectedApiaryId}
              className="w-full flex items-center justify-between gap-2 bg-cream-100 border border-cream-200 rounded-lg px-4 py-3 text-sm text-wood-700 hover:border-wood-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={selectedSpecies ? 'text-wood-800' : 'text-wood-400'}>
                {selectedSpecies?.common_name_it ?? 'Seleziona pianta…'}
              </span>
              <ChevronDown size={16} className="text-wood-400 shrink-0" />
            </button>
            {showSpeciesPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSpeciesPicker(false)} />
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-cream-50 border border-cream-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {species.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedSpeciesId(s.id); setShowSpeciesPicker(false); setForecastLat(null); setForecastLng(null) }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-cream-100 transition-colors flex items-center justify-between ${
                        s.id === selectedSpeciesId ? 'bg-cream-100 font-medium text-wood-800' : 'text-wood-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Flower2 size={13} className="text-honey-500 shrink-0" />
                        {s.common_name_it}
                      </span>
                      <span className="text-[10px] text-wood-400">
                        {'★'.repeat(s.honey_relevance)}{'☆'.repeat(5 - s.honey_relevance)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            disabled={!selectedApiaryId || !selectedSpeciesId}
            loading={weatherLoading}
            onClick={() => {
              if (selectedApiary) {
                setForecastLat(selectedApiary.latitude)
                setForecastLng(selectedApiary.longitude)
              }
            }}
          >
            Previsione
          </Button>

          {/* Weather loading */}
          {forecastLat != null && weatherLoading && (
            <div className="flex items-center justify-center py-8 text-sm text-wood-400">
              Caricamento dati meteo…
            </div>
          )}

          {/* Prediction result */}
          {forecastLat != null && selectedPrediction && selectedSpecies && (
            <div className="mt-2 bg-cream-100 border border-cream-200 rounded-xl p-4 flex flex-col gap-3">
              {/* Phase badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-wood-800">{selectedSpecies.common_name_it}</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${phaseColor(selectedPrediction.current_phase)}`}>
                  {phaseLabel(selectedPrediction.current_phase)}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-wood-500 mb-1">
                  <span>Progresso GDD</span>
                  <span>{selectedPrediction.current_gdd} / {selectedSpecies.gdd_bloom_end} GDD</span>
                </div>
                <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-honey-500 rounded-full transition-all duration-500"
                    style={{ width: `${gddProgressPct(selectedPrediction.current_gdd, 0, selectedSpecies.gdd_bloom_end)}%` }}
                  />
                </div>
                {/* Milestone markers */}
                <div className="relative mt-1" style={{ height: '18px' }}>
                  <span
                    className="absolute text-[9px] text-wood-400 whitespace-nowrap"
                    style={{ left: `${gddProgressPct(selectedSpecies.gdd_bloom_start, 0, selectedSpecies.gdd_bloom_end)}%`, transform: 'translateX(-50%)' }}
                  >
                    ▼ Inizio
                  </span>
                  <span
                    className="absolute text-[9px] text-wood-400 whitespace-nowrap"
                    style={{ left: `${gddProgressPct(selectedSpecies.gdd_bloom_peak, 0, selectedSpecies.gdd_bloom_end)}%`, transform: 'translateX(-50%)' }}
                  >
                    ▼ Picco
                  </span>
                  <span
                    className="absolute text-[9px] text-wood-400 whitespace-nowrap"
                    style={{ left: `${gddProgressPct(selectedSpecies.gdd_bloom_end, 0, selectedSpecies.gdd_bloom_end)}%`, transform: 'translateX(-100%)' }}
                  >
                    ▼ Fine
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-cream-50 rounded-md px-2 py-1.5">
                  <p className="text-[10px] text-wood-400 uppercase">Inizio</p>
                  <p className="text-xs font-semibold text-wood-700">
                    {selectedPrediction.bloom_start?.date
                      ? new Date(selectedPrediction.bloom_start.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
                <div className="bg-cream-50 rounded-md px-2 py-1.5">
                  <p className="text-[10px] text-wood-400 uppercase">Picco</p>
                  <p className="text-xs font-semibold text-wood-700">
                    {selectedPrediction.bloom_peak?.date
                      ? new Date(selectedPrediction.bloom_peak.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
                <div className="bg-cream-50 rounded-md px-2 py-1.5">
                  <p className="text-[10px] text-wood-400 uppercase">Fine</p>
                  <p className="text-xs font-semibold text-wood-700">
                    {selectedPrediction.bloom_end?.date
                      ? new Date(selectedPrediction.bloom_end.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>

              {selectedSpecies.notes_it && (
                <p className="text-xs text-wood-500 italic">{selectedSpecies.notes_it}</p>
              )}
            </div>
          )}

          {/* No apiaries with location warning */}
          {apiaries.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10">
              <MapPin size={36} className="text-wood-300" />
              <p className="text-sm text-wood-500 text-center max-w-xs">
                Nessun apiario ha la posizione impostata. Aggiungi latitudine e longitudine a un apiario per visualizzare le previsioni di fioritura.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
