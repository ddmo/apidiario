import { useState } from 'react'
import { Flower } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SectionLabel } from './components/section-label'
import { QueenSightingPicker } from './components/queen-sighting-picker'
import { BroodStageToggles } from './components/brood-stage-toggles'
import { QueenCellsGrid } from './components/queen-cells-grid'
import { FrameCounter } from './components/frame-counter'
import { PathologyChip } from './components/pathology-chip'
import { InspectionNoteField } from './components/inspection-note-field'
import { InspectionMediaPicker } from './components/inspection-media-picker'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { PATHOLOGY_OPTIONS, VARROA_METHOD_OPTIONS, INTERVENTION_OPTIONS, PENDING_INTERVENTION_OPTIONS } from './constants'
import type { InspectionFormState, PathologyType, VoiceNote } from './types'

const POPULATION_OPTIONS = [
  { value: 'debole', label: 'Debole' },
  { value: 'media', label: 'Media' },
  { value: 'forte', label: 'Forte' },
]

const BEHAVIOR_OPTIONS = [
  { value: 'calmo', label: 'Calmo' },
  { value: 'nervoso', label: 'Nervoso' },
  { value: 'aggressivo', label: 'Aggressivo' },
]

interface StandardBodyProps {
  state: InspectionFormState
  dirtyFields: Set<string>
  onUpdate: <K extends keyof InspectionFormState>(key: K, value: InspectionFormState[K]) => void
  weather?: { temperature: number; summary: string } | null
  voiceNotes: VoiceNote[]
  isRecording: boolean
  canRecord: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onPickAudioFile: () => void
  onDeleteVoiceNote: (id: string) => void
  inspectionMedia: MediaItem[]
  pendingMedia: PendingMediaItem[]
  mediaUploading: boolean
  onMediaFilesSelected: (files: File[]) => void
  onRemoveMedia: (id: string) => void
  onRemovePendingMedia: (id: string) => void
  disableVoiceAndMedia?: boolean
}

interface MediaItem {
  id: string
  media_type: string
  signedUrl?: string
}

interface PendingMediaItem {
  id: string
  previewUrl: string
  file: File
}

export function StandardBody({ state, dirtyFields, onUpdate, weather, voiceNotes, isRecording, canRecord, onStartRecording, onStopRecording, onPickAudioFile, onDeleteVoiceNote, inspectionMedia, pendingMedia, mediaUploading, onMediaFilesSelected, onRemoveMedia, onRemovePendingMedia, disableVoiceAndMedia }: StandardBodyProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const d = (key: string) => dirtyFields.has(key)

  const togglePathology = (p: PathologyType) => {
    const next = new Set(state.pathologies)
    if (next.has(p)) { next.delete(p) } else { next.add(p) }
    onUpdate('pathologies', next)
  }

  const toggleIntervention = (i: string) => {
    const next = new Set(state.interventions)
    if (next.has(i)) { next.delete(i) } else { next.add(i) }
    onUpdate('interventions', next)
  }

  const togglePendingIntervention = (i: string) => {
    const next = new Set(state.pendingInterventions)
    if (next.has(i)) { next.delete(i) } else { next.add(i) }
    onUpdate('pendingInterventions', next)
  }

  // Ogni sezione è definita una sola volta e riusata sia nel flusso mobile (ordine sequenziale)
  // sia nelle colonne tablet (due colonne indipendenti, per evitare il gap del grid quando i campi hanno altezze diverse).

  const reginaSection = (
    <section key="regina">
      <SectionLabel required>Regina</SectionLabel>
      <QueenSightingPicker value={state.queen} onChange={(v) => onUpdate('queen', v)} dirty={d('queen')} />
    </section>
  )

  const covataSection = (
    <section key="covata">
      <SectionLabel>Covata</SectionLabel>
      <button
        type="button"
        aria-pressed={state.hasBrood}
        onClick={() => onUpdate('hasBrood', !state.hasBrood)}
        className={`w-full h-12 rounded-md border px-4 flex items-center justify-between transition-colors ${state.hasBrood ? 'bg-honey-300/60 border-honey-500 text-wood-800' : 'bg-cream-50 border-cream-200 text-wood-500'}`}
      >
        <span className="text-sm font-medium">
          {state.hasBrood ? 'Covata presente' : 'Covata assente'}
        </span>
        <span className={`h-6 w-10 rounded-full p-0.5 transition-colors duration-150 ${state.hasBrood ? 'bg-honey-500' : 'bg-cream-200'}`}>
          <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${state.hasBrood ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
      </button>
      {state.hasBrood && (
        <div className="mt-3">
          <BroodStageToggles value={state.brood} onChange={(v) => onUpdate('brood', v)} dirty={d('brood')} />
        </div>
      )}
    </section>
  )

  const popolazioneSection = (
    <section key="popolazione">
      <SectionLabel required>Popolazione</SectionLabel>
      <SegmentedControl
        ariaLabel="Popolazione"
        options={POPULATION_OPTIONS}
        value={state.population}
        onChange={(v) => onUpdate('population', v as InspectionFormState['population'])}
        dirty={d('population')}
      />
    </section>
  )

  const telainiSection = (
    <section key="telaini">
      <SectionLabel>Telaini</SectionLabel>
      <div className="flex flex-col gap-2">
        <FrameCounter label="Telaini covata" value={state.frames.covata} dirty={d('frames')}
          onChange={(v) => onUpdate('frames', { ...state.frames, covata: v })} />
        <FrameCounter label="Telaini miele" value={state.frames.miele} dirty={d('frames')}
          onChange={(v) => onUpdate('frames', { ...state.frames, miele: v })} />
        <FrameCounter label="Telaini polline" value={state.frames.polline} dirty={d('frames')}
          onChange={(v) => onUpdate('frames', { ...state.frames, polline: v })} />
        <FrameCounter label="Telaini vuoti" value={state.frames.vuoti} dirty={d('frames')}
          onChange={(v) => onUpdate('frames', { ...state.frames, vuoti: v })} />
      </div>
    </section>
  )

  const pollenSection = (
    <section key="pollen">
      <SectionLabel>Importazione polline</SectionLabel>
      <button
        type="button"
        aria-pressed={state.pollenIncoming}
        onClick={() => onUpdate('pollenIncoming', !state.pollenIncoming)}
        className={`w-full h-12 rounded-md border px-4 flex items-center justify-between transition-colors ${state.pollenIncoming ? 'bg-honey-300/60 border-honey-500 text-wood-800' : 'bg-cream-50 border-cream-200 text-wood-500'}`}
      >
        <span className="inline-flex items-center gap-2.5 text-sm font-medium">
          <Flower size={18} />
          {state.pollenIncoming ? 'Bottinatrici al lavoro' : 'Nessuna importazione'}
        </span>
        <span className={`h-6 w-10 rounded-full p-0.5 transition-colors duration-150 ${state.pollenIncoming ? 'bg-honey-500' : 'bg-cream-200'}`}>
          <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${state.pollenIncoming ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
      </button>
    </section>
  )

  const celleRealiSection = (
    <section key="celle-reali">
      <SectionLabel>Celle reali</SectionLabel>
      <button
        type="button"
        aria-pressed={state.hasQueenCells}
        onClick={() => onUpdate('hasQueenCells', !state.hasQueenCells)}
        className={`w-full h-12 rounded-md border px-4 flex items-center justify-between transition-colors ${state.hasQueenCells ? 'bg-honey-300/60 border-honey-500 text-wood-800' : 'bg-cream-50 border-cream-200 text-wood-500'}`}
      >
        <span className="text-sm font-medium">
          {state.hasQueenCells ? 'Celle reali presenti' : 'Nessuna cella reale'}
        </span>
        <span className={`h-6 w-10 rounded-full p-0.5 transition-colors duration-150 ${state.hasQueenCells ? 'bg-honey-500' : 'bg-cream-200'}`}>
          <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${state.hasQueenCells ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
      </button>
      {state.hasQueenCells && (
        <div className="mt-3 flex flex-col gap-3">
          <QueenCellsGrid
            title="Tolte"
            selected={state.queenCellsRemoved}
            onToggle={(v) => {
              const remaining = state.queenCellsRemaining.filter((t) => t !== v)
              const removed = state.queenCellsRemoved.includes(v)
                ? state.queenCellsRemoved.filter((t) => t !== v)
                : [...state.queenCellsRemoved, v]
              onUpdate('queenCellsRemoved', removed)
              onUpdate('queenCellsRemaining', remaining)
            }}
          />
          <QueenCellsGrid
            title="Lasciate"
            selected={state.queenCellsRemaining}
            onToggle={(v) => {
              const removed = state.queenCellsRemoved.filter((t) => t !== v)
              const remaining = state.queenCellsRemaining.includes(v)
                ? state.queenCellsRemaining.filter((t) => t !== v)
                : [...state.queenCellsRemaining, v]
              onUpdate('queenCellsRemoved', removed)
              onUpdate('queenCellsRemaining', remaining)
            }}
          />
        </div>
      )}
    </section>
  )

  const comportamentoSection = (
    <section key="comportamento">
      <SectionLabel>Comportamento</SectionLabel>
      <SegmentedControl
        ariaLabel="Comportamento"
        options={BEHAVIOR_OPTIONS}
        value={state.behavior}
        onChange={(v) => onUpdate('behavior', v as InspectionFormState['behavior'])}
        dirty={d('behavior')}
      />
    </section>
  )

  const patologieSection = (
    <section key="patologie">
      <SectionLabel>Segni patologici</SectionLabel>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none]">
        {PATHOLOGY_OPTIONS.map(([value, label]) => (
          <PathologyChip
            key={value}
            label={label}
            selected={state.pathologies.has(value)}
            onClick={() => togglePathology(value)}
            dirty={d('pathologies')}
          />
        ))}
      </div>
    </section>
  )

  const varroaSection = (
    <section key="varroa">
      <SectionLabel>Conteggio varroa</SectionLabel>
      <div className="flex flex-col gap-2">
        <Input
          id="varroa-count"
          aria-label="Numero acari"
          type="number"
          inputMode="decimal"
          placeholder="Numero acari"
          value={state.varroaCount}
          onChange={(e) => onUpdate('varroaCount', e.target.value)}
        />
        <SegmentedControl
          ariaLabel="Metodo conteggio varroa"
          options={VARROA_METHOD_OPTIONS.map(([v, l]) => ({ value: v, label: l }))}
          value={state.varroaMethod}
          onChange={(v) => onUpdate('varroaMethod', v as InspectionFormState['varroaMethod'])}
          dirty={d('varroaMethod')}
        />
      </div>
    </section>
  )

  const interventiSection = (
    <section key="interventi">
      <SectionLabel>Interventi eseguiti</SectionLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {INTERVENTION_OPTIONS.map((i) => (
          <PathologyChip
            key={i}
            label={i}
            selected={state.interventions.has(i)}
            onClick={() => toggleIntervention(i)}
            dirty={d('interventions')}
            tone="honey"
          />
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Altri interventi…"
        value={state.otherInterventions}
        onChange={(e) => onUpdate('otherInterventions', e.target.value)}
        className="w-full bg-cream-50 border border-cream-200 rounded-md px-4 py-2.5 text-sm text-wood-700 placeholder:text-wood-400 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20 resize-none"
      />
    </section>
  )

  const interventiDaFareSection = (
    <section key="interventi-da-fare">
      <SectionLabel>Interventi da eseguire</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {PENDING_INTERVENTION_OPTIONS.map((i) => (
          <PathologyChip
            key={i}
            label={i}
            selected={state.pendingInterventions.has(i)}
            onClick={() => togglePendingIntervention(i)}
            dirty={d('pendingInterventions')}
            tone="honey"
          />
        ))}
      </div>
    </section>
  )

  const mediaSection = !disableVoiceAndMedia ? (
    <section key="media">
      <SectionLabel>Foto / video</SectionLabel>
      <InspectionMediaPicker
        media={inspectionMedia}
        pendingMedia={pendingMedia}
        uploading={mediaUploading}
        onFilesSelected={onMediaFilesSelected}
        onRemove={onRemoveMedia}
        onRemovePending={onRemovePendingMedia}
      />
    </section>
  ) : null

  const noteSection = (
    <section key="note">
      <SectionLabel>Note</SectionLabel>
      <InspectionNoteField
        value={state.notes}
        expanded={noteOpen}
        onExpand={() => setNoteOpen(true)}
        onChange={(v) => onUpdate('notes', v)}
        dirty={d('notes')}
        voiceNotes={voiceNotes}
        isRecording={isRecording}
        canRecord={canRecord}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onPickAudioFile={onPickAudioFile}
        onDeleteVoiceNote={onDeleteVoiceNote}
        disableVoiceAndMedia={disableVoiceAndMedia}
      />
    </section>
  )

  const interventoNecessarioSection = (
    <section key="intervento-necessario">
      <SectionLabel>Necessario intervento</SectionLabel>
      <button
        type="button"
        aria-pressed={state.needsIntervention}
        onClick={() => onUpdate('needsIntervention', !state.needsIntervention)}
        className={`w-full h-12 rounded-md border px-4 flex items-center justify-between transition-colors ${state.needsIntervention ? 'bg-danger-500/15 border-danger-500 text-wood-800' : 'bg-cream-50 border-cream-200 text-wood-500'}`}
      >
        <span className="text-sm font-medium">
          {state.needsIntervention ? 'Intervento necessario' : 'Nessun intervento necessario'}
        </span>
        <span className={`h-6 w-10 rounded-full p-0.5 transition-colors duration-150 ${state.needsIntervention ? 'bg-danger-500' : 'bg-cream-200'}`}>
          <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${state.needsIntervention ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
      </button>
    </section>
  )

  const meteoSection = weather ? (
    <section key="meteo">
      <SectionLabel>Meteo</SectionLabel>
      <div className="flex flex-col gap-2">
        <div className="h-12 flex items-center px-4 rounded-md border border-cream-200 bg-cream-100/60 text-sm text-wood-600">
          <span className="text-wood-400 text-xs w-20">Temperatura</span>
          <span className="font-medium">{weather.temperature}°C</span>
        </div>
        <div className="min-h-[44px] flex items-center px-4 rounded-md border border-cream-200 bg-cream-100/60 text-sm text-wood-600">
          <span className="text-wood-400 text-xs w-20 shrink-0">Condizioni</span>
          <span className="text-xs leading-relaxed">{weather.summary}</span>
        </div>
      </div>
    </section>
  ) : null

  return (
    <div className="px-4 py-4">
      {/* Mobile: colonna singola, ordine sequenziale */}
      <div className="flex flex-col gap-6 tablet:hidden">
        {reginaSection}
        {covataSection}
        {popolazioneSection}
        {telainiSection}
        {pollenSection}
        {celleRealiSection}
        {comportamentoSection}
        {patologieSection}
        {varroaSection}
        {interventiSection}
        {interventiDaFareSection}
        {mediaSection}
        {noteSection}
        {interventoNecessarioSection}
        {meteoSection}
      </div>

      {/* Tablet/desktop: due colonne indipendenti per gruppo, sezioni full-width fuori dalle colonne.
          Evita il gap del grid a 2 colonne quando i campi hanno altezze diverse (es. Telaini vs Popolazione). */}
      <div className="hidden tablet:flex tablet:flex-col tablet:gap-6">
        <div className="tablet:flex tablet:gap-x-8 tablet:items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {reginaSection}
            {popolazioneSection}
            {pollenSection}
            {comportamentoSection}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {covataSection}
            {telainiSection}
            {celleRealiSection}
          </div>
        </div>

        {patologieSection}

        <div className="tablet:flex tablet:gap-x-8 tablet:items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {varroaSection}
            {interventiDaFareSection}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {interventiSection}
          </div>
        </div>

        {mediaSection}
        {noteSection}

        <div className="tablet:flex tablet:gap-x-8 tablet:items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {interventoNecessarioSection}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {meteoSection}
          </div>
        </div>
      </div>
    </div>
  )
}
