import type { ReactNode } from 'react'
import { Flower } from 'lucide-react'
import { SectionLabel } from './components/section-label'
import { QueenSightingPicker } from './components/queen-sighting-picker'
import { BroodStageToggles } from './components/brood-stage-toggles'
import { QueenCellsGrid } from './components/queen-cells-grid'
import { PathologyChip } from './components/pathology-chip'
import { InspectionNoteField } from './components/inspection-note-field'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Input } from '@/components/ui/input'
import { PATHOLOGY_OPTIONS, VARROA_METHOD_OPTIONS, INTERVENTION_OPTIONS } from './constants'
import type { InspectionFormState, PathologyType, VoiceNote } from './types'
import type { ExpressField } from './express-fields-constants'

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

interface SectionContext {
  state: InspectionFormState
  onUpdate: <K extends keyof InspectionFormState>(key: K, value: InspectionFormState[K]) => void
  d: (key: string) => boolean
  noteOpen: boolean
  setNoteOpen: (v: boolean) => void
  voiceNotes: VoiceNote[]
  isRecording: boolean
  canRecord: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onPickAudioFile: () => void
  onDeleteVoiceNote: (id: string) => void
  disabledExtra?: boolean
}

function renderQueenSection(ctx: SectionContext): ReactNode {
  return (
    <section key="queen">
      <SectionLabel required>Regina</SectionLabel>
      <QueenSightingPicker value={ctx.state.queen} onChange={(v) => ctx.onUpdate('queen', v)} dirty={ctx.d('queen')} />
    </section>
  )
}

function renderBroodSection(ctx: SectionContext): ReactNode {
  return (
    <section key="hasBrood">
      <SectionLabel>Covata</SectionLabel>
      <button
        type="button"
        aria-pressed={ctx.state.hasBrood}
        onClick={() => ctx.onUpdate('hasBrood', !ctx.state.hasBrood)}
        className={`w-full h-12 rounded-md border px-4 flex items-center justify-between transition-colors ${ctx.state.hasBrood ? 'bg-honey-300/60 border-honey-500 text-wood-800' : 'bg-cream-50 border-cream-200 text-wood-500'}`}
      >
        <span className="text-sm font-medium">
          {ctx.state.hasBrood ? 'Covata presente' : 'Covata assente'}
        </span>
        <span className={`h-6 w-10 rounded-full p-0.5 transition-colors duration-150 ${ctx.state.hasBrood ? 'bg-honey-500' : 'bg-cream-200'}`}>
          <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${ctx.state.hasBrood ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
      </button>
      {ctx.state.hasBrood && (
        <div className="mt-3">
          <BroodStageToggles value={ctx.state.brood} onChange={(v) => ctx.onUpdate('brood', v)} dirty={ctx.d('brood')} />
        </div>
      )}
    </section>
  )
}

function renderPopulationSection(ctx: SectionContext): ReactNode {
  return (
    <section key="population">
      <SectionLabel required>Popolazione</SectionLabel>
      <SegmentedControl
        ariaLabel="Popolazione"
        options={POPULATION_OPTIONS}
        value={ctx.state.population}
        onChange={(v) => ctx.onUpdate('population', v as InspectionFormState['population'])}
        dirty={ctx.d('population')}
      />
    </section>
  )
}

function renderQueenCellsSection(ctx: SectionContext): ReactNode {
  return (
    <section key="hasQueenCells">
      <SectionLabel>Celle reali</SectionLabel>
      <button
        type="button"
        aria-pressed={ctx.state.hasQueenCells}
        onClick={() => ctx.onUpdate('hasQueenCells', !ctx.state.hasQueenCells)}
        className={`w-full h-12 rounded-md border px-4 flex items-center justify-between transition-colors ${ctx.state.hasQueenCells ? 'bg-honey-300/60 border-honey-500 text-wood-800' : 'bg-cream-50 border-cream-200 text-wood-500'}`}
      >
        <span className="text-sm font-medium">
          {ctx.state.hasQueenCells ? 'Celle reali presenti' : 'Nessuna cella reale'}
        </span>
        <span className={`h-6 w-10 rounded-full p-0.5 transition-colors duration-150 ${ctx.state.hasQueenCells ? 'bg-honey-500' : 'bg-cream-200'}`}>
          <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${ctx.state.hasQueenCells ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
      </button>
      {ctx.state.hasQueenCells && (
        <div className="mt-3 flex flex-col gap-3">
          <QueenCellsGrid
            title="Tolte"
            selected={ctx.state.queenCellsRemoved}
            onToggle={(v) => {
              const remaining = ctx.state.queenCellsRemaining.filter((t) => t !== v)
              const removed = ctx.state.queenCellsRemoved.includes(v)
                ? ctx.state.queenCellsRemoved.filter((t) => t !== v)
                : [...ctx.state.queenCellsRemoved, v]
              ctx.onUpdate('queenCellsRemoved', removed)
              ctx.onUpdate('queenCellsRemaining', remaining)
            }}
          />
          <QueenCellsGrid
            title="Lasciate"
            selected={ctx.state.queenCellsRemaining}
            onToggle={(v) => {
              const removed = ctx.state.queenCellsRemoved.filter((t) => t !== v)
              const remaining = ctx.state.queenCellsRemaining.includes(v)
                ? ctx.state.queenCellsRemaining.filter((t) => t !== v)
                : [...ctx.state.queenCellsRemaining, v]
              ctx.onUpdate('queenCellsRemoved', removed)
              ctx.onUpdate('queenCellsRemaining', remaining)
            }}
          />
        </div>
      )}
    </section>
  )
}

function renderBehaviorSection(ctx: SectionContext): ReactNode {
  return (
    <section key="behavior">
      <SectionLabel>Comportamento</SectionLabel>
      <SegmentedControl
        ariaLabel="Comportamento"
        options={BEHAVIOR_OPTIONS}
        value={ctx.state.behavior}
        onChange={(v) => ctx.onUpdate('behavior', v as InspectionFormState['behavior'])}
        dirty={ctx.d('behavior')}
      />
    </section>
  )
}

function renderPollenSection(ctx: SectionContext): ReactNode {
  return (
    <section key="pollenIncoming">
      <SectionLabel>Importazione polline</SectionLabel>
      <button
        type="button"
        aria-pressed={ctx.state.pollenIncoming}
        onClick={() => ctx.onUpdate('pollenIncoming', !ctx.state.pollenIncoming)}
        className={`w-full h-12 rounded-md border px-4 flex items-center justify-between transition-colors ${ctx.state.pollenIncoming ? 'bg-honey-300/60 border-honey-500 text-wood-800' : 'bg-cream-50 border-cream-200 text-wood-500'}`}
      >
        <span className="inline-flex items-center gap-2.5 text-sm font-medium">
          <Flower size={18} />
          {ctx.state.pollenIncoming ? 'Bottinatrici al lavoro' : 'Nessuna importazione'}
        </span>
        <span className={`h-6 w-10 rounded-full p-0.5 transition-colors duration-150 ${ctx.state.pollenIncoming ? 'bg-honey-500' : 'bg-cream-200'}`}>
          <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${ctx.state.pollenIncoming ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
      </button>
    </section>
  )
}

function renderPathologiesSection(ctx: SectionContext): ReactNode {
  return (
    <section key="pathologies">
      <SectionLabel>Segni patologici</SectionLabel>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none]">
        {PATHOLOGY_OPTIONS.map(([value, label]) => (
          <PathologyChip
            key={value}
            label={label}
            selected={ctx.state.pathologies.has(value)}
            onClick={() => {
              const next = new Set(ctx.state.pathologies)
              if (next.has(value)) { next.delete(value) } else { next.add(value) }
              ctx.onUpdate('pathologies', next)
            }}
            dirty={ctx.d('pathologies')}
          />
        ))}
      </div>
    </section>
  )
}

function renderVarroaSection(ctx: SectionContext): ReactNode {
  return (
    <section key="varroa">
      <SectionLabel>Conteggio varroa</SectionLabel>
      <div className="flex flex-col gap-2">
        <Input
          id="varroa-count"
          aria-label="Numero acari"
          type="number"
          inputMode="decimal"
          placeholder="Numero acari"
          value={ctx.state.varroaCount}
          onChange={(e) => ctx.onUpdate('varroaCount', e.target.value)}
        />
        <SegmentedControl
          ariaLabel="Metodo conteggio varroa"
          options={VARROA_METHOD_OPTIONS.map(([v, l]) => ({ value: v, label: l }))}
          value={ctx.state.varroaMethod}
          onChange={(v) => ctx.onUpdate('varroaMethod', v as InspectionFormState['varroaMethod'])}
          dirty={ctx.d('varroaMethod')}
        />
      </div>
    </section>
  )
}

function renderInterventionsSection(ctx: SectionContext): ReactNode {
  const toggleIntervention = (i: string) => {
    const next = new Set(ctx.state.interventions)
    if (next.has(i)) { next.delete(i) } else { next.add(i) }
    ctx.onUpdate('interventions', next)
  }

  return (
    <section key="interventions">
      <SectionLabel>Interventi eseguiti</SectionLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {INTERVENTION_OPTIONS.map((i) => (
          <PathologyChip
            key={i}
            label={i}
            selected={ctx.state.interventions.has(i)}
            onClick={() => toggleIntervention(i)}
            dirty={ctx.d('interventions')}
            tone="honey"
          />
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Altri interventi…"
        value={ctx.state.otherInterventions}
        onChange={(e) => ctx.onUpdate('otherInterventions', e.target.value)}
        className="w-full bg-cream-50 border border-cream-200 rounded-md px-4 py-2.5 text-sm text-wood-700 placeholder:text-wood-400 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20 resize-none"
      />
    </section>
  )
}

function renderNotesSection(ctx: SectionContext): ReactNode {
  return (
    <section key="notes">
      <SectionLabel>Note</SectionLabel>
      <InspectionNoteField
        value={ctx.state.notes}
        expanded={ctx.noteOpen}
        onExpand={() => ctx.setNoteOpen(true)}
        onChange={(v) => ctx.onUpdate('notes', v)}
        dirty={ctx.d('notes')}
        voiceNotes={ctx.voiceNotes}
        isRecording={ctx.isRecording}
        canRecord={ctx.canRecord}
        onStartRecording={ctx.onStartRecording}
        onStopRecording={ctx.onStopRecording}
        onPickAudioFile={ctx.onPickAudioFile}
        onDeleteVoiceNote={ctx.onDeleteVoiceNote}
        disableVoiceAndMedia={ctx.disabledExtra}
      />
    </section>
  )
}

export const EXPRESS_FIELD_RENDERERS: Record<ExpressField, (ctx: SectionContext) => ReactNode> = {
  queen: renderQueenSection,
  hasBrood: renderBroodSection,
  population: renderPopulationSection,
  hasQueenCells: renderQueenCellsSection,
  notes: renderNotesSection,
  behavior: renderBehaviorSection,
  pollenIncoming: renderPollenSection,
  pathologies: renderPathologiesSection,
  varroa: renderVarroaSection,
  interventions: renderInterventionsSection,
}
