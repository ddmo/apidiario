import { ArrowLeft, MoreVertical, Sun } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ExpressBody } from './express-body'
import { StandardBody } from './standard-body'
import { PrefillBanner } from './components/prefill-banner'
import { FormSubmitBar } from './components/form-submit-bar'
import { UnsavedChangesSheet } from './components/unsaved-changes-sheet'
import { useInspectionForm } from './use-inspection-form'
import type { InspectionFormState } from './types'

const MODE_OPTIONS = [
  { value: 'express', label: 'Express' },
  { value: 'standard', label: 'Standard' },
]

// Header: 56px nav bar (no status bar — handled by OS)
// Mode tabs: 52px (p-1 top + p-2 bottom + 40px control)
// Banner: 41px (always reserved to avoid layout shift)
// Submit bar: 68px
const HEADER_H = 56
const TABS_H = 52
const BANNER_H = 41
const SUBMIT_H = 68

interface HiveInfo {
  identifier: string
  apiaryName: string
}

interface InspectionScreenProps {
  hiveId: string
  hiveInfo?: HiveInfo
  prefillState?: Partial<InspectionFormState>
  hasPrefill: boolean
  prefillDate?: string
  isLoadingHistory?: boolean
  isSaving?: boolean
  onSave: (state: InspectionFormState, mode: string) => void
  onBack: () => void
}

export function InspectionScreen({
  hiveInfo,
  prefillState,
  hasPrefill,
  prefillDate,
  isLoadingHistory = false,
  isSaving = false,
  onSave,
  onBack,
}: InspectionScreenProps) {
  const { state, dirtyFields, mode, setMode, update, reset, hasChanges, showSheet, setShowSheet } =
    useInspectionForm({ prefillState })

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

  function handleSave() {
    onSave(state, mode)
  }

  const scrollH = `calc(100dvh - ${HEADER_H + TABS_H + BANNER_H + SUBMIT_H}px)`

  return (
    <div className="bg-cream-50 text-wood-700 flex flex-col min-h-dvh">
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
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Sun size={12} aria-hidden="true" />
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Altre opzioni"
            className="size-11 flex items-center justify-center text-wood-500 hover:bg-cream-100 rounded-md transition-colors"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Mode tabs */}
      <div className="px-4 pt-3 pb-2">
        <SegmentedControl
          ariaLabel="Modalità ispezione"
          options={MODE_OPTIONS}
          value={mode}
          onChange={(v) => setMode(v as 'express' | 'standard')}
        />
      </div>

      {/* Banner — always 41px reserved to avoid layout shift */}
      <div className="h-[41px]">
        {!isLoadingHistory && hasPrefill && (
          <PrefillBanner kind="prefilled" lastDate={prefillDate} onReset={reset} />
        )}
        {!isLoadingHistory && !hasPrefill && (
          <PrefillBanner kind="first" />
        )}
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto" style={{ height: scrollH }}>
        {mode === 'express' ? (
          <ExpressBody state={state} dirtyFields={dirtyFields} onUpdate={update} />
        ) : (
          <StandardBody state={state} dirtyFields={dirtyFields} onUpdate={update} />
        )}
      </div>

      {/* Submit bar */}
      <FormSubmitBar onCancel={handleBack} onSave={handleSave} isSaving={isSaving} />

      {/* Unsaved changes sheet */}
      <UnsavedChangesSheet
        open={showSheet}
        onSave={handleSave}
        onDiscard={onBack}
        onCancel={() => setShowSheet(false)}
      />
    </div>
  )
}
