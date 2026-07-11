import { useState } from 'react'
import { useExpressFields } from './hooks/use-express-fields'
import { EXPRESS_FIELD_RENDERERS, type SectionContext } from './express-field-renderers'
import type { InspectionFormState, VoiceNote } from './types'

interface ExpressBodyProps {
  state: InspectionFormState
  dirtyFields: Set<string>
  onUpdate: <K extends keyof InspectionFormState>(key: K, value: InspectionFormState[K]) => void
  voiceNotes: VoiceNote[]
  isRecording: boolean
  canRecord: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onPickAudioFile: () => void
  onDeleteVoiceNote: (id: string) => void
  disableVoiceAndMedia?: boolean
}

export function ExpressBody({
  state, dirtyFields, onUpdate,
  voiceNotes, isRecording, canRecord,
  onStartRecording, onStopRecording, onPickAudioFile, onDeleteVoiceNote,
  disableVoiceAndMedia,
}: ExpressBodyProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const d = (key: string) => dirtyFields.has(key)
  const fields = useExpressFields()
  const ctx: SectionContext = {
    state, onUpdate, d,
    noteOpen, setNoteOpen,
    voiceNotes, isRecording, canRecord,
    onStartRecording, onStopRecording, onPickAudioFile, onDeleteVoiceNote,
    disabledExtra: disableVoiceAndMedia,
  }

  const colA = fields.filter((_, i) => i % 2 === 0)
  const colB = fields.filter((_, i) => i % 2 === 1)

  return (
    <div className="px-4 py-4">
      {/* Mobile: colonna singola nell'ordine configurato */}
      <div className="flex flex-col gap-5 tablet:hidden">
        {fields.map((key) => {
          const renderFn = EXPRESS_FIELD_RENDERERS[key]
          return renderFn ? renderFn(ctx) : null
        })}
      </div>

      {/* Tablet/desktop: due colonne indipendenti, ciascuna scorre per la propria altezza (niente grid: evita righe con gap causate da campi di altezza diversa) */}
      <div className="hidden tablet:flex tablet:gap-x-8 tablet:items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {colA.map((key) => {
            const renderFn = EXPRESS_FIELD_RENDERERS[key]
            return renderFn ? renderFn(ctx) : null
          })}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {colB.map((key) => {
            const renderFn = EXPRESS_FIELD_RENDERERS[key]
            return renderFn ? renderFn(ctx) : null
          })}
        </div>
      </div>
    </div>
  )
}
