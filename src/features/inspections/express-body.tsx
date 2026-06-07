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

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      {fields.map((key) => {
        const renderFn = EXPRESS_FIELD_RENDERERS[key]
        return renderFn ? renderFn(ctx) : null
      })}
    </div>
  )
}
