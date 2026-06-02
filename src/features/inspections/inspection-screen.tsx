import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MoreVertical, Sun, Trash2, Mic, Square, Loader2, Sparkles, AlertCircle, Speech } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Button } from '@/components/ui/button'
import { ExpressBody } from './express-body'
import { StandardBody } from './standard-body'
import { PrefillBanner } from './components/prefill-banner'
import { FormSubmitBar } from './components/form-submit-bar'
import { UnsavedChangesSheet } from './components/unsaved-changes-sheet'
import { useInspectionForm } from './use-inspection-form'
import { useVoiceNotes } from './hooks/use-voice-notes'
import { useInspectionMedia } from './hooks/use-inspection-media'
import { useVoiceInspection } from '@/features/voice-inspection/hooks/use-voice-inspection'
import type { InspectionFormState, InspectionMode } from './types'

const MODE_OPTIONS = [
  { value: 'express', label: 'Express' },
  { value: 'standard', label: 'Standard' },
]

interface HiveInfo {
  identifier: string
  apiaryName: string
}

interface InspectionScreenProps {
  hiveId: string
  inspectionId?: string | null
  hiveInfo?: HiveInfo
  prefillState?: Partial<InspectionFormState>
  initialMode?: InspectionMode
  hasPrefill: boolean
  prefillDate?: string
  isLoadingHistory?: boolean
  isSaving?: boolean
  isDeleting?: boolean
  weather?: { temperature: number; summary: string } | null
  onSave: (state: InspectionFormState, mode: string, commit: (inspectionId: string) => Promise<void>) => void | Promise<void>
  onBack: () => void
  onDelete?: () => void
}

export function InspectionScreen({
  hiveId,
  hiveInfo,
  inspectionId,
  prefillState,
  initialMode,
  hasPrefill,
  prefillDate,
  isLoadingHistory = false,
  isSaving = false,
  isDeleting = false,
  weather,
  onSave,
  onBack,
  onDelete,
}: InspectionScreenProps) {
  const { state, dirtyFields, mode, setMode, update, reset, markClean, hasChanges, showSheet, setShowSheet } =
    useInspectionForm({ prefillState, initialMode })

  const { voiceNotes, isRecording, canRecord, startRecording, stopRecording, pickAudioFile, removeVoiceNote, commit } =
    useVoiceNotes({ inspectionId: inspectionId ?? null })

  const {
    media: inspectionMedia,
    pendingMedia,
    uploading: mediaUploading,
    handleMediaFiles: onMediaFilesSelected,
    removeMedia,
    removePending,
    commit: commitMedia,
  } = useInspectionMedia(inspectionId ?? null)

  const voiceInsp = useVoiceInspection({ hiveId: hiveId })
  const voiceAppliedRef = useRef(false)
  const [showingVoice, setShowingVoice] = useState(false)

  useEffect(() => {
    if (voiceInsp.status === 'success' && voiceInsp.result && !voiceAppliedRef.current) {
      voiceAppliedRef.current = true
      const result = voiceInsp.result
      const entries = Object.entries(result) as [keyof InspectionFormState, InspectionFormState[keyof InspectionFormState]][]
      for (const [key, value] of entries) {
        update(key, value)
      }

      // Standard-only fields con valori significativi → mostra scheda standard
      const hasStandardData =
        (result.frames?.covata ?? 0) > 0 ||
        (result.frames?.miele ?? 0) > 0 ||
        (result.frames?.polline ?? 0) > 0 ||
        (result.queenCells && result.queenCells !== 'nessuna') ||
        (result.pathologies && result.pathologies.size > 0) ||
        result.pollenIncoming === true ||
        (result.varroaCount && result.varroaCount !== '') ||
        (result.varroaMethod && result.varroaMethod !== 'caduta_naturale') ||
        (result.behavior && result.behavior !== 'calmo') ||
        (result.interventions && result.interventions.size > 0)

      setShowingVoice(false)
      setMode(hasStandardData ? 'standard' : 'express')
    }
  }, [voiceInsp.status, voiceInsp.result, update])

  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)

  const now = new Date()
  const datetime = now.toLocaleString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  function handleBack() {
    if (hasChanges) {
      setShowSheet(true)
    } else {
      onBack()
    }
  }

  async function handleSave() {
    await onSave(state, mode, async (id) => {
      await commit(id)
      await commitMedia(id)
    })
    markClean()
  }

  return (
    <div className="fixed inset-0 bg-cream-50 text-wood-700 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur-sm border-b border-cream-200">
        <div className="flex items-center gap-3 h-14 px-2">
          <button
            type="button"
            aria-label="Indietro"
            onClick={handleBack}
            className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-wood-800 truncate">
              {hiveInfo ? (
                <>
                  {hiveInfo.apiaryName} ·{' '}
                  <span className="text-honey-600">{hiveInfo.identifier}</span>
                </>
              ) : (
                <span className="text-wood-400">Caricamento…</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-wood-500">
              <span>{datetime}</span>
              {weather && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Sun size={12} aria-hidden="true" />
                    <span>{weather.temperature}°C</span>
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label={showingVoice ? 'Chiudi registrazione vocale' : 'Ispezione vocale'}
            onClick={() => {
              if (showingVoice) {
                voiceInsp.reset()
                voiceAppliedRef.current = false
                setShowingVoice(false)
              } else {
                setShowingVoice(true)
              }
            }}
            className={cn(
              'size-11 flex items-center justify-center rounded-md transition-colors',
              showingVoice
                ? 'text-cream-50 bg-honey-500 hover:bg-honey-600'
                : 'text-wood-500 hover:bg-cream-100',
            )}
          >
            <Speech size={20} />
          </button>
          {onDelete && (
            <div className="relative">
              <button
                type="button"
                aria-label="Altre opzioni"
                onClick={() => setShowMenu((v) => !v)}
                className="size-11 flex items-center justify-center text-wood-500 hover:bg-cream-100 rounded-md transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-1 z-30 bg-cream-50 border border-cream-200 rounded-xl shadow-lg min-w-[200px] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); setShowDeleteSheet(true) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium whitespace-nowrap text-danger-500 hover:bg-cream-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      Elimina ispezione
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mode tabs — hidden during voice recording */}
      {!showingVoice && (
        <div className="px-4 pt-3 pb-2">
          <SegmentedControl
            ariaLabel="Modalità ispezione"
            options={MODE_OPTIONS}
            value={mode}
            onChange={(v) => setMode(v as 'express' | 'standard')}
          />
        </div>
      )}

      {/* Banner — always 41px reserved to avoid layout shift */}
      <div className="h-[41px]">
        {!isLoadingHistory && hasPrefill && (
          <PrefillBanner kind="prefilled" lastDate={prefillDate} onReset={reset} />
        )}
        {!isLoadingHistory && !hasPrefill && !prefillState && (
          <PrefillBanner kind="first" />
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {showingVoice ? (
          <VoiceModeView
            status={voiceInsp.status}
            error={voiceInsp.error}
            transcript={voiceInsp.transcript}
            onStart={voiceInsp.startRecording}
            onStop={voiceInsp.stopRecording}
            onReset={voiceInsp.reset}
          />
        ) : mode === 'express' ? (
          <ExpressBody
            state={state}
            dirtyFields={dirtyFields}
            onUpdate={update}
            voiceNotes={voiceNotes}
            isRecording={isRecording}
            canRecord={canRecord}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onPickAudioFile={pickAudioFile}
            onDeleteVoiceNote={removeVoiceNote}
          />
        ) : (
          <StandardBody
            state={state}
            dirtyFields={dirtyFields}
            onUpdate={update}
            weather={weather}
            voiceNotes={voiceNotes}
            isRecording={isRecording}
            canRecord={canRecord}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onPickAudioFile={pickAudioFile}
            onDeleteVoiceNote={removeVoiceNote}
            inspectionMedia={inspectionMedia}
            pendingMedia={pendingMedia}
            mediaUploading={mediaUploading}
            onMediaFilesSelected={onMediaFilesSelected}
            onRemoveMedia={removeMedia}
            onRemovePendingMedia={removePending}
          />
        )}
      </div>

      {/* Submit bar */}
      <FormSubmitBar onCancel={handleBack} onSave={handleSave} isSaving={isSaving} saveDisabled={!hasChanges} />

      {/* Unsaved changes sheet */}
      <UnsavedChangesSheet
        open={showSheet}
        onSave={handleSave}
        onDiscard={onBack}
        onCancel={() => setShowSheet(false)}
      />

      {/* Delete confirmation sheet */}
      {showDeleteSheet && (
        <>
          <div
            className="fixed inset-0 z-30 bg-wood-900/40"
            onClick={() => setShowDeleteSheet(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Elimina ispezione"
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg animate-slide-up"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">Elimina ispezione</h2>
              <p className="text-sm text-wood-500 leading-relaxed">
                Sei sicuro di voler eliminare questa ispezione? L&rsquo;operazione non pu&ograve; essere annullata.
              </p>
            </div>
            <div className="px-4 flex flex-col gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
              <Button
                variant="destructive"
                size="lg"
                onClick={() => { setShowDeleteSheet(false); onDelete?.() }}
                disabled={isDeleting}
                className="w-full"
              >
                {isDeleting ? 'Eliminazione…' : 'Elimina'}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setShowDeleteSheet(false)} className="w-full">
                Annulla
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

type VoiceStatus = 'idle' | 'recording' | 'processing' | 'success' | 'error'

function VoiceModeView({
  status,
  error,
  transcript,
  onStart,
  onStop,
  onReset,
}: {
  status: VoiceStatus
  error: string | null
  transcript: string | null
  onStart: () => void
  onStop: () => void
  onReset: () => void
}) {
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 py-16 select-none">
        <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <Sparkles size={32} className="text-green-600" />
        </div>
        <p className="text-base font-semibold text-wood-800 text-center">Scheda compilata</p>
        <p className="text-sm text-wood-500 text-center mt-1">Verifica e salva</p>
        {transcript && (
          <details className="mt-6 w-full max-w-sm">
            <summary className="text-xs text-wood-400 cursor-pointer hover:text-wood-600 text-center select-text">Trascrizione</summary>
            <p className="text-xs text-wood-500 mt-2 leading-relaxed select-text">{transcript}</p>
          </details>
        )}
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 py-16 select-none">
        <div className="size-16 rounded-full bg-honey-500/10 flex items-center justify-center mb-4">
          <Loader2 size={32} className="text-honey-600 animate-spin" />
        </div>
        <p className="text-base font-semibold text-wood-800">Elaborazione in corso</p>
        <p className="text-sm text-wood-500 text-center mt-1">Stiamo analizzando la registrazione</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 py-16 select-none">
        <div className="size-16 rounded-full bg-danger-500/10 flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-danger-500" />
        </div>
        <p className="text-base font-semibold text-danger-600 text-center select-none">Errore</p>
        <p className="text-sm text-wood-500 text-center mt-1 mb-6">{error || 'Qualcosa è andato storto'}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onStart}
            className="h-11 px-6 rounded-lg bg-danger-500 text-cream-50 text-sm font-semibold hover:bg-danger-500/90 transition-colors"
          >
            Riprova
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-11 px-6 rounded-lg bg-cream-200 text-wood-700 text-sm font-semibold hover:bg-cream-300 transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    )
  }

  // idle or recording
  const isRecording = status === 'recording'
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-16 select-none">
      <button
        type="button"
        onClick={isRecording ? onStop : onStart}
        className={cn(
          'size-24 rounded-full flex items-center justify-center transition-all mb-6',
          isRecording
            ? 'bg-danger-500 animate-pulse shadow-lg shadow-danger-500/40'
            : 'bg-honey-500 hover:bg-honey-600 shadow-lg shadow-honey-500/30 hover:shadow-xl hover:shadow-honey-500/40',
        )}
      >
        {isRecording ? (
          <Square size={28} className="text-cream-50 fill-cream-50" />
        ) : (
          <Mic size={36} className="text-cream-50" />
        )}
      </button>
      <p className="text-base font-semibold text-wood-800">
        {isRecording ? 'Registrazione in corso' : 'Registra ispezione'}
      </p>
      <p className="text-sm text-wood-500 text-center mt-1">
        {isRecording
          ? 'Tocca il pulsante per fermare'
          : 'Tocca il microfono e parla a voce alta'}
      </p>
    </div>
  )
}
