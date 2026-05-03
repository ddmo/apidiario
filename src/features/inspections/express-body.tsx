import { useState } from 'react'
import { SectionLabel } from './components/section-label'
import { QueenSightingPicker } from './components/queen-sighting-picker'
import { BroodStageToggles } from './components/brood-stage-toggles'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { InspectionNoteField } from './components/inspection-note-field'
import type { InspectionFormState } from './types'

const POPULATION_OPTIONS = [
  { value: 'debole', label: 'Debole' },
  { value: 'media', label: 'Media' },
  { value: 'forte', label: 'Forte' },
]

interface ExpressBodyProps {
  state: InspectionFormState
  dirtyFields: Set<string>
  onUpdate: <K extends keyof InspectionFormState>(key: K, value: InspectionFormState[K]) => void
}

export function ExpressBody({ state, dirtyFields, onUpdate }: ExpressBodyProps) {
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
        <BroodStageToggles
          value={state.brood}
          onChange={(v) => onUpdate('brood', v)}
          dirty={d('brood')}
        />
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
        />
      </section>
    </div>
  )
}
