import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Flower2, ChevronDown, HelpCircle, X } from 'lucide-react'
import {
  usePhenologySpecies,
  useWeatherData,
  useBloomPredictions,
} from '@/features/phenology/hooks/use-phenology'
import { computeCorrectionFactor } from '@/lib/phenology/predict'
import {
  useBloomObservations,
  useUpsertBloomObservation,
} from '@/features/phenology/hooks/use-bloom-observations'
import { logActivity } from '@/lib/activity-log'

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
  const [showHelp, setShowHelp] = useState(false)
  const [usePersonalObs, setUsePersonalObs] = useState(false)
  const [showObsSheet, setShowObsSheet] = useState(false)
  const [obsStartDate, setObsStartDate] = useState('')
  const [obsEndDate, setObsEndDate] = useState('')

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
  const { data: observations = [] } = useBloomObservations(
    selectedApiaryId ?? undefined,
    selectedSpeciesId ?? undefined,
  )
  const upsertObs = useUpsertBloomObservation(session?.user?.id ?? '')

  const selectedSpecies = selectedSpeciesId
    ? species.find((s) => s.id === selectedSpeciesId) ?? null
    : null

  const correctionFactor = useMemo(() => {
    if (!usePersonalObs || !weather || !selectedSpecies || observations.length === 0 || forecastLat == null) return null
    const obs = observations.find((o) => o.year === year)
    if (!obs?.observed_start_date) return null
    return computeCorrectionFactor(weather, obs.observed_start_date, selectedSpecies.gdd_bloom_start)
  }, [usePersonalObs, weather, selectedSpecies, observations, year, forecastLat])

  const correctionFactors = useMemo(() => {
    if (correctionFactor == null || !selectedSpeciesId) return undefined
    return { [selectedSpeciesId]: correctionFactor }
  }, [correctionFactor, selectedSpeciesId])

  const predictions = useBloomPredictions(weather, species, correctionFactors)

  const selectedPrediction = selectedSpeciesId
    ? predictions.find((p) => p.species_id === selectedSpeciesId) ?? null
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
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Previsioni fioriture
        </h1>
        <button
          type="button"
          aria-label="Come funziona"
          onClick={() => setShowHelp(true)}
          className="size-11 flex items-center justify-center text-wood-500 hover:text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <HelpCircle size={22} strokeWidth={1.75} />
        </button>
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

              {/* Toggle osservazioni personali */}
              <div className="border-t border-cream-200 pt-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-wood-700">Usa osservazioni personali</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={usePersonalObs}
                    onClick={() => setUsePersonalObs((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      usePersonalObs ? 'bg-honey-500' : 'bg-cream-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        usePersonalObs ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </label>
                {usePersonalObs && correctionFactor != null && (
                  <p className="mt-1.5 text-xs text-green-700">
                    Tarato ×{correctionFactor.toFixed(3)} su osservazione inizio fioritura
                  </p>
                )}
                {usePersonalObs && correctionFactor == null && observations.length === 0 && (
                  <p className="mt-1.5 text-xs text-wood-500">
                    Nessuna osservazione registrata. Registra la prima qui sotto.
                  </p>
                )}
                {usePersonalObs && correctionFactor == null && observations.length > 0 && (
                  <p className="mt-1.5 text-xs text-wood-500">
                    Nessuna data inizio fioritura registrata per {year}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Registra osservazione button */}
          {forecastLat != null && selectedPrediction && selectedSpecies && (
            <button
              type="button"
              onClick={() => {
                setObsStartDate(selectedPrediction.bloom_start?.date ?? '')
                setObsEndDate(selectedPrediction.bloom_end?.date ?? '')
                setShowObsSheet(true)
              }}
              className="w-full text-sm bg-cream-100 border border-dashed border-cream-300 rounded-xl py-3 text-wood-600 hover:bg-cream-200 hover:border-wood-300 transition-colors"
            >
              + Registra osservazione fioritura
            </button>
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

      {/* Observation form sheet */}
      {showObsSheet && selectedPrediction && selectedSpecies && (
        <>
          <div className="fixed inset-0 z-30 bg-wood-900/40" onClick={() => setShowObsSheet(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Registra osservazione fioritura"
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg max-h-[80dvh] flex flex-col"
          >
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-2 pb-1 shrink-0 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-wood-800">Registra osservazione</h2>
              <button
                type="button"
                aria-label="Chiudi"
                onClick={() => setShowObsSheet(false)}
                className="size-8 flex items-center justify-center text-wood-500 hover:text-wood-700 hover:bg-cream-100 rounded-md transition-colors -mr-1"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 text-sm text-wood-600 space-y-4">
              <p className="text-wood-700 font-medium">{selectedSpecies.common_name_it} — {year}</p>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-wood-500 mb-1">
                  Inizio fioritura osservato
                </label>
                <input
                  type="date"
                  value={obsStartDate}
                  onChange={(e) => setObsStartDate(e.target.value)}
                  className="w-full bg-cream-100 border border-cream-200 rounded-lg px-3 py-2.5 text-sm text-wood-700"
                />
                {selectedPrediction.bloom_start?.date && (
                  <p className="text-[10px] text-wood-400 mt-0.5">
                    Previsto: {new Date(selectedPrediction.bloom_start.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-wood-500 mb-1">
                  Fine fioritura osservata
                </label>
                <input
                  type="date"
                  value={obsEndDate}
                  onChange={(e) => setObsEndDate(e.target.value)}
                  className="w-full bg-cream-100 border border-cream-200 rounded-lg px-3 py-2.5 text-sm text-wood-700"
                />
                {selectedPrediction.bloom_end?.date && (
                  <p className="text-[10px] text-wood-400 mt-0.5">
                    Previsto: {new Date(selectedPrediction.bloom_end.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="w-full bg-honey-500 text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
                disabled={upsertObs.isPending}
                onClick={async () => {
                  if (!selectedApiaryId || !selectedSpeciesId) return
                  await upsertObs.mutateAsync({
                    apiary_id: selectedApiaryId,
                    species_id: selectedSpeciesId,
                    year,
                    observed_start_date: obsStartDate || null,
                    observed_end_date: obsEndDate || null,
                  })
                  if (session?.user?.id) {
                    logActivity(session.user.id, 'insert', 'bloom_observation', null,
                      `Osservazione fioritura: ${selectedSpecies.common_name_it} (${year})`
                    )
                  }
                  setUsePersonalObs(true)
                  setShowObsSheet(false)
                }}
              >
                {upsertObs.isPending ? 'Salvataggio…' : 'Salva osservazione'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Help sheet */}
      {showHelp && (
        <>
          <div className="fixed inset-0 z-30 bg-wood-900/40" onClick={() => setShowHelp(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Come funzionano le previsioni"
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg max-h-[80dvh] flex flex-col"
          >
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-2 pb-1 shrink-0 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-wood-800">Come funzionano le previsioni</h2>
              <button
                type="button"
                aria-label="Chiudi"
                onClick={() => setShowHelp(false)}
                className="size-8 flex items-center justify-center text-wood-500 hover:text-wood-700 hover:bg-cream-100 rounded-md transition-colors -mr-1"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 text-sm text-wood-600 leading-relaxed space-y-4">
              <section>
                <h3 className="font-semibold text-wood-700 mb-1">GDD — Gradi Giorno di Sviluppo</h3>
                <p>
                  I GDD (Growing Degree Days) sono un indice che misura l'accumulo di calore necessario
                  affinché una pianta completi le fasi del suo ciclo fenologico. Si calcolano giorno per giorno
                  sottraendo la temperatura di base (sotto la quale la pianta non si sviluppa) dalla
                  temperatura media giornaliera.
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-wood-700 mb-1">Formula</h3>
                <p className="font-mono text-xs bg-cream-100 border border-cream-200 rounded-md p-3 text-wood-600">
                  GDD_giornaliero = max(0, (T_max + T_min) / 2 − T_base)
                </p>
                <p className="mt-1">
                  Dove T<sub>max</sub> e T<sub>min</sub> sono le temperature massima e minima del giorno,
                  e T<sub>base</sub> è la temperatura soglia specifica per ogni specie (tipicamente 10°C).
                  I GDD si accumulano a partire dal 1° gennaio di ogni anno.
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-wood-700 mb-1">Fasi della fioritura</h3>
                <ul className="space-y-1.5">
                  <li><span className="font-medium text-wood-700">Pre-fioritura</span> — la pianta sta accumulando calore ma non ha ancora raggiunto la soglia di inizio fioritura.</li>
                  <li><span className="font-medium text-wood-700">Inizio fioritura</span> — sono stati accumulati abbastanza GDD per avviare la fioritura (soglia <em>gdd_bloom_start</em>).</li>
                  <li><span className="font-medium text-wood-700">Picco fioritura</span> — massima attività floreale, raggiunto alla soglia <em>gdd_bloom_peak</em>.</li>
                  <li><span className="font-medium text-wood-700">Post-fioritura</span> — la fioritura sta terminando; i GDD accumulati hanno superato la soglia <em>gdd_bloom_end</em>.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-wood-700 mb-1">Fonti dati</h3>
                <p>
                  I dati meteo provengono da <strong>Open-Meteo</strong>, un servizio gratuito che fornisce
                  temperature storiche e stimate per le coordinate dell'apiario selezionato. Le soglie GDD
                  per ogni specie sono definite nel database e si basano su dati bibliografici.
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-wood-700 mb-1">Limitazioni</h3>
                <p>
                  Le previsioni sono una stima basata su medie storiche e dati meteorologici generici.
                  Microclimi locali, altitudine, esposizione e pratiche di gestione possono influenzare
                  le date reali di fioritura. Usa le previsioni come riferimento, non come dato certo.
                </p>
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
