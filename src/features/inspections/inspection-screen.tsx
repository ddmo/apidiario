import { useState } from 'react'
import { ArrowLeft, MoreVertical, Sun, Trash2 } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Button } from '@/components/ui/button'
import { ExpressBody } from './express-body'
import { StandardBody } from './standard-body'
import { PrefillBanner } from './components/prefill-banner'
import { FormSubmitBar } from './components/form-submit-bar'
import { UnsavedChangesSheet } from './components/unsaved-changes-sheet'
import { useInspectionForm } from './use-inspection-form'
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
  hiveInfo?: HiveInfo
  prefillState?: Partial<InspectionFormState>
  initialMode?: InspectionMode
  hasPrefill: boolean
  prefillDate?: string
  isLoadingHistory?: boolean
  isSaving?: boolean
  isDeleting?: boolean
  onSave: (state: InspectionFormState, mode: string) => void
  onBack: () => void
  onDelete?: () => void
}

export function InspectionScreen({
  hiveInfo,
  prefillState,
  initialMode,
  hasPrefill,
  prefillDate,
  isLoadingHistory = false,
  isSaving = false,
  isDeleting = false,
  onSave,
  onBack,
  onDelete,
}: InspectionScreenProps) {
  const { state, dirtyFields, mode, setMode, update, reset, hasChanges, showSheet, setShowSheet } =
    useInspectionForm({ prefillState, initialMode })

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

  function handleSave() {
    onSave(state, mode)
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
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Sun size={12} aria-hidden="true" />
              </span>
            </div>
          </div>
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
                  <div className="absolute right-0 top-full mt-1 z-30 bg-cream-50 border border-cream-200 rounded-xl shadow-lg min-w-[160px] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); setShowDeleteSheet(true) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger-500 hover:bg-cream-100 transition-colors"
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
      <div className="flex-1 overflow-y-auto min-h-0">
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
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg"
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
