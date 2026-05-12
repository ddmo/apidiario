import { useState } from 'react'
import { SectionLabel } from './components/section-label'
import { QueenSightingPicker } from './components/queen-sighting-picker'
import { BroodStageToggles } from './components/brood-stage-toggles'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { InspectionNoteField } from './components/inspection-note-field'
import type { InspectionFormState, VoiceNote } from './types'

const POPULATION_OPTIONS = [
  { value: 'debole', label: 'Debole' },
  { value: 'media', label: 'Media' },
  { value: 'forte', label: 'Forte' },
]

interface ExpressBodyProps {
  state: InspectionFormState
  dirtyFields: Set<string>
  onUpdate: <K extends keyof InspectionFormState>(key: K, value: InspectionFormState[K]) => void
  voiceNotes: VoiceNote[]
  isRecording: boolean
  canRecord: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onDeleteVoiceNote: (id: string) => void
}

export function ExpressBody({ state, dirtyFields, onUpdate, voiceNotes, isRecording, canRecord, onStartRecording, onStopRecording, onDeleteVoiceNote }: ExpressBodyProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const d = (key: string) => dirtyFields.has(key)

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <section>
        <SectionLabel required>Regina</SectionLabel>
        <QueenSightingPicker
          value={state.queen}
          onChange={(v) => onUpdate('queen', v)}
          dirty={d('queen')}
        />
      </section>

      <section>
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
          <span className={`h-6 w-10 rounded-full p-0.5 transition-colors ${state.hasBrood ? 'bg-honey-500' : 'bg-cream-200'}`}>
            <span className={`block size-5 rounded-full bg-cream-50 transition-transform ${state.hasBrood ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>
        {state.hasBrood && (
          <div className="mt-3">
            <BroodStageToggles value={state.brood} onChange={(v) => onUpdate('brood', v)} dirty={d('brood')} />
          </div>
        )}
      </section>

      <section>
        <SectionLabel required>Popolazione</SectionLabel>
        <SegmentedControl
          ariaLabel="Popolazione"
          options={POPULATION_OPTIONS}
          value={state.population}
          onChange={(v) => onUpdate('population', v as InspectionFormState['population'])}
          dirty={d('population')}
        />
      </section>

      <section>
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
          onDeleteVoiceNote={onDeleteVoiceNote}
        />
      </section>

    </div>
  )
}
