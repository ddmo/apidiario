import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowRight, Check, ChevronLeft, Pencil, Trees, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { logActivity } from '@/lib/activity-log'
import { useBatchInspection } from '@/features/inspections/batch/use-batch-inspection'
import { useInspectionForm } from '@/features/inspections/use-inspection-form'
import { ExpressBody } from '@/features/inspections/express-body'
import { StandardBody } from '@/features/inspections/standard-body'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { HiveListItem } from '@/features/hives/hooks/use-hives'
import { uuid } from '@/lib/utils'
import type { InspectionFormState } from '@/features/inspections/types'
import type { TablesInsert } from '@/types/database'

export const Route = createFileRoute('/inspections/batch/$apiaryId')({
  validateSearch: (search: Record<string, unknown>) => ({
    selected: Array.isArray(search.selected)
      ? search.selected.map(String)
      : typeof search.selected === 'string'
        ? [search.selected]
        : [] as string[],
  }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: BatchInspectionPage,
})

function BatchInspectionPage() {
  const { apiaryId } = Route.useParams()
  const { selected } = Route.useSearch()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { showToast } = useToast()
  const batch = useBatchInspection(apiaryId, selected.length > 0 ? selected : undefined)
  const form = useInspectionForm()

  const [editingHiveId, setEditingHiveId] = useState<string | null>(null)
  const [addingNoteHiveId, setAddingNoteHiveId] = useState<string | null>(null)

  const { data: apiary } = useQuery({
    queryKey: ['apiary', apiaryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apiaries')
        .select('id, name')
        .eq('id', apiaryId)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: hives = [] } = useQuery({
    queryKey: ['hives-by-apiary', apiaryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hives')
        .select('id, identifier, status, apiary_id')
        .eq('apiary_id', apiaryId)
        .is('archived_at', null)
        .eq('status', 'attiva')
        .order('identifier')
      if (error) throw error
      return data as unknown as HiveListItem[]
    },
  })

  const batchSave = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      const selectedHives = hives.filter((h) => batch.state.selectedHiveIds.includes(h.id))
      const batchId = uuid()
      const isExpress = batch.state.mode === 'express'

      const inspections: TablesInsert<'inspections'>[] = selectedHives.map((hive) => {
        const values = batch.getEffectiveValues(hive.id)
        const perHiveNote = batch.state.perHiveNotes[hive.id]
        const combinedNotes = perHiveNote
          ? [values.notes, `---\n${perHiveNote}`].filter(Boolean).join('\n')
          : values.notes || null

        return {
          hive_id: hive.id,
          performed_by: session.user.id,
          batch_id: batchId,
          queen_seen: values.queen,
          brood_eggs: values.hasBrood ? values.brood.uova : false,
          brood_larvae: values.hasBrood ? values.brood.larve : false,
          brood_capped: values.hasBrood ? values.brood.opercolata : false,
          population: values.population,
          notes: combinedNotes,
          brood_frame_count: isExpress ? null : values.frames.covata,
          honey_frame_count: isExpress ? null : values.frames.miele,
          pollen_frame_count: isExpress ? null : values.frames.polline,
          queen_cells: isExpress ? null : values.queenCells,
          pollen_importation: isExpress ? null : values.pollenIncoming,
          behavior: isExpress ? null : values.behavior,
          pathologies: isExpress ? null : Array.from(values.pathologies),
          varroa_count: isExpress || !values.varroaCount ? null : Number(values.varroaCount),
          varroa_count_method: isExpress || !values.varroaCount ? null : values.varroaMethod,
          interventions: isExpress ? [] : Array.from(values.interventions),
        }
      })

      const { data, error } = await supabase
        .from('inspections')
        .insert(inspections)
        .select('id, hive_id')
      if (error) throw error

      // Activity log for each inspection
      for (const insp of data) {
        const hive = selectedHives.find((h) => h.id === insp.hive_id)
        await logActivity(
          session.user.id,
          'insert',
          'hive',
          insp.hive_id,
          `Ispezione batch: arnia ${hive?.identifier ?? ''}`,
        )
      }

      return data
    },
    onSuccess: () => {
      const selectedHiveIds = batch.state.selectedHiveIds
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
      void queryClient.invalidateQueries({ queryKey: ['hives-by-apiary'] })
      for (const id of selectedHiveIds) {
        void queryClient.invalidateQueries({ queryKey: ['lastInspection', id] })
        void queryClient.invalidateQueries({ queryKey: ['inspections', id] })
      }
      showToast('Ispezioni salvate', 'success')
      navigate({ to: '/apiaries/$apiaryId', params: { apiaryId } })
    },
    onError: (err) => {
      console.error('Batch save failed:', err)
      showToast('Salvataggio fallito. Riprova.', 'error')
    },
  })

  function goBack() {
    if (batch.state.step === 'select-hives') {
      navigate({ to: '/apiaries/$apiaryId', params: { apiaryId } })
    } else if (batch.state.step === 'base-form') {
      batch.setStep('select-hives')
    } else if (batch.state.step === 'review') {
      batch.setStep('base-form')
    }
  }

  const selectedHiveData = hives.filter((h) => batch.state.selectedHiveIds.includes(h.id))

  return (
    <div className="fixed inset-0 bg-cream-50 text-wood-700 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur-sm border-b border-cream-200">
        <div className="flex items-center gap-2 h-14 px-2">
          <button
            type="button"
            aria-label="Indietro"
            onClick={goBack}
            className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-wood-400 leading-none mb-0.5">
              {apiary?.name ?? '…'}
            </p>
            <h1 className="font-display text-lg font-medium text-wood-800 tracking-tight truncate leading-tight">
              Ispezione multipla
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {['select-hives', 'base-form', 'review'].map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  batch.state.step === s
                    ? 'bg-honey-500'
                    : ['select-hives', 'base-form', 'review'].indexOf(batch.state.step) > i
                    ? 'bg-honey-300'
                    : 'bg-cream-200'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {batch.state.step === 'select-hives' && (
          <SelectHivesStep
            hives={hives}
            selectedIds={batch.state.selectedHiveIds}
            onToggle={(id) => {
              const next = batch.state.selectedHiveIds.includes(id)
                ? batch.state.selectedHiveIds.filter((x) => x !== id)
                : [...batch.state.selectedHiveIds, id]
              batch.setSelectedHiveIds(next)
            }}
            onSelectAll={() => batch.setSelectedHiveIds(hives.map((h) => h.id))}
            onDeselectAll={() => batch.setSelectedHiveIds([])}
            onNext={() => batch.setStep('base-form')}
          />
        )}
        {batch.state.step === 'base-form' && (
          <BaseFormStep
            count={batch.state.selectedHiveIds.length}
            batch={batch}
            form={form}
          />
        )}
        {batch.state.step === 'review' && (
          <ReviewStep
            hives={selectedHiveData}
            getEffectiveValues={batch.getEffectiveValues}
            isCustomized={batch.isCustomized}
            perHiveNotes={batch.state.perHiveNotes}
            customizedCount={batch.customizedCount}
            onEditHive={(hiveId) => setEditingHiveId(hiveId)}
            onNoteHive={(hiveId) => setAddingNoteHiveId(hiveId)}
            onRemoveNote={(hiveId) => batch.removeHiveNote(hiveId)}
            isSaving={batchSave.isPending}
            onSave={() => batchSave.mutate()}
            onGoToBase={() => batch.setStep('base-form')}
          />
        )}
      </div>

      {/* Per-hive edit sheet */}
      {editingHiveId && (
        <PerHiveEditSheet
          key={editingHiveId}
          hive={selectedHiveData.find((h) => h.id === editingHiveId) ?? null}
          effectiveValues={batch.getEffectiveValues(editingHiveId)}
          onSave={(override) => {
            batch.setHiveOverride(editingHiveId, override)
            setEditingHiveId(null)
          }}
          onClose={() => setEditingHiveId(null)}
        />
      )}

      {/* Per-hive note sheet */}
      {addingNoteHiveId && (
        <PerHiveNoteSheet
          hive={selectedHiveData.find((h) => h.id === addingNoteHiveId) ?? null}
          initialNote={batch.state.perHiveNotes[addingNoteHiveId] ?? ''}
          onSave={(note) => {
            if (note.trim()) {
              batch.setHiveNote(addingNoteHiveId, note.trim())
            } else {
              batch.removeHiveNote(addingNoteHiveId)
            }
            setAddingNoteHiveId(null)
          }}
          onClose={() => setAddingNoteHiveId(null)}
        />
      )}
    </div>
  )
}

// ── Step 2: Select hives ──────────────────────────────────────────────────

function SelectHivesStep({
  hives,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onNext,
}: {
  hives: { id: string; identifier: string }[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onNext: () => void
}) {
  const allSelected = hives.length > 0 && selectedIds.length === hives.length

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs font-medium text-honey-600 hover:text-honey-700 px-2 py-1 rounded-md hover:bg-cream-100 transition-colors"
          >
            {allSelected ? 'Deseleziona tutte' : 'Seleziona tutte'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-1">
          {hives.map((hive) => {
            const selected = selectedIds.includes(hive.id)
            return (
              <button
                key={hive.id}
                type="button"
                onClick={() => onToggle(hive.id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'bg-honey-500/10 text-wood-800'
                    : 'hover:bg-cream-100 text-wood-600'
                }`}
              >
                <div
                  className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selected
                      ? 'bg-honey-500 border-honey-500'
                      : 'border-wood-300'
                  }`}
                >
                  {selected && <Check size={14} className="text-white" />}
                </div>
                <Trees size={16} className="text-wood-400 shrink-0" />
                <span className="font-medium">{hive.identifier}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-cream-200 px-4 py-4">
        <p className="text-sm text-wood-500 mb-1">
          {selectedIds.length} arnie selezionate
        </p>
        {selectedIds.length < 2 && (
          <p className="text-xs text-wood-400 mb-2">
            Seleziona almeno 2 arnie. Per una sola arnia usa l'ispezione singola.
          </p>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={selectedIds.length < 2}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 text-sm font-medium text-cream-50 hover:bg-honey-600 disabled:opacity-40 transition-colors"
        >
          Avanti
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Base form ───────────────────────────────────────────────────

const MODE_OPTIONS = [
  { value: 'express', label: 'Express' },
  { value: 'standard', label: 'Standard' },
]

function BaseFormStep({
  count,
  batch,
  form,
}: {
  count: number
  batch: ReturnType<typeof useBatchInspection>
  form: ReturnType<typeof useInspectionForm>
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-lg bg-honey-500/10 border border-honey-500/20 px-4 py-3">
          <p className="text-sm text-wood-700">
            Stai compilando un'ispezione per <strong>{count} arnie</strong>.
            I valori inseriti verranno applicati a tutte. Potrai personalizzare
            ogni arnia nel passo successivo.
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-4 pb-3">
        <SegmentedControl
          ariaLabel="Modalità ispezione"
          options={MODE_OPTIONS}
          value={form.mode}
          onChange={(v) => form.setMode(v as 'express' | 'standard')}
        />
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {form.mode === 'express' ? (
          <ExpressBody
            state={form.state}
            dirtyFields={form.dirtyFields}
            onUpdate={form.update}
            voiceNotes={[]}
            isRecording={false}
            canRecord={false}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onPickAudioFile={() => {}}
            onDeleteVoiceNote={() => {}}
            disableVoiceAndMedia
          />
        ) : (
          <StandardBody
            state={form.state}
            dirtyFields={form.dirtyFields}
            onUpdate={form.update}
            voiceNotes={[]}
            isRecording={false}
            canRecord={false}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onPickAudioFile={() => {}}
            onDeleteVoiceNote={() => {}}
            inspectionMedia={[]}
            pendingMedia={[]}
            mediaUploading={false}
            onMediaFilesSelected={() => {}}
            onRemoveMedia={() => {}}
            onRemovePendingMedia={() => {}}
            disableVoiceAndMedia
          />
        )}
      </div>

      <div className="shrink-0 border-t border-cream-200 px-4 py-4">
        <button
          type="button"
          onClick={() => {
            batch.setBaseValues(form.state, form.mode)
            batch.setStep('review')
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 text-sm font-medium text-cream-50 hover:bg-honey-600 transition-colors"
        >
          Avanti
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Review ──────────────────────────────────────────────────────

function queenLabel(queen: string): string {
  if (queen === 'vista') return 'Vista'
  if (queen === 'non_cercata') return 'Non cercata'
  return 'Non vista'
}

function popLabel(p: string): string {
  if (p === 'forte') return 'Forte'
  if (p === 'debole') return 'Debole'
  return 'Media'
}

function ReviewStep({
  hives,
  getEffectiveValues,
  isCustomized,
  perHiveNotes,
  customizedCount,
  onEditHive,
  onNoteHive,
  isSaving,
  onSave,
  onGoToBase,
}: {
  hives: { id: string; identifier: string }[]
  getEffectiveValues: (hiveId: string) => InspectionFormState
  isCustomized: (hiveId: string) => boolean
  perHiveNotes: Record<string, string>
  customizedCount: number
  onEditHive: (hiveId: string) => void
  onNoteHive: (hiveId: string) => void
  onRemoveNote: (hiveId: string) => void
  isSaving: boolean
  onSave: () => void
  onGoToBase: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-wood-700">
            Revisione ispezioni
          </p>
          <button
            type="button"
            onClick={onGoToBase}
            className="text-xs font-medium text-honey-600 hover:text-honey-700 px-2 py-1 rounded-md hover:bg-cream-100 transition-colors"
          >
            Modifica base
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {hives.map((hive) => {
            const values = getEffectiveValues(hive.id)
            const customized = isCustomized(hive.id)
            const hasNote = hive.id in perHiveNotes

            return (
              <div
                key={hive.id}
                className="rounded-lg border border-cream-200 bg-cream-100 px-4 py-3"
              >
                {/* Hive header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trees size={16} className="text-wood-400 shrink-0" />
                    <span className="text-sm font-medium text-wood-800">
                      {hive.identifier}
                    </span>
                    {customized && (
                      <span className="text-[10px] font-medium text-honey-600 bg-honey-200/50 px-1.5 py-0.5 rounded">
                        Personalizzata
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Nota per arnia ${hive.identifier}`}
                      onClick={() => onNoteHive(hive.id)}
                      className="size-7 flex items-center justify-center rounded-md text-wood-400 hover:text-wood-600 hover:bg-cream-200 transition-colors"
                    >
                      <FileText size={14} strokeWidth={hasNote ? 2.5 : 1.75} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Personalizza arnia ${hive.identifier}`}
                      onClick={() => onEditHive(hive.id)}
                      className="size-7 flex items-center justify-center rounded-md text-wood-400 hover:text-wood-600 hover:bg-cream-200 transition-colors"
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* Key indicators */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-wood-500">
                  <span>Regina: <strong className="text-wood-700">{queenLabel(values.queen)}</strong></span>
                  <span>Pop.: <strong className="text-wood-700">{popLabel(values.population)}</strong></span>
                  <span>Covata: <strong className="text-wood-700">{values.hasBrood ? 'Sì' : 'No'}</strong></span>
                  <span>Melari: <strong className="text-wood-700">{values.frames.miele ?? 0}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-cream-200 px-4 py-4">
        {customizedCount > 0 && (
          <p className="text-xs text-wood-500 mb-2 text-center">
            {customizedCount} arnia{customizedCount > 1 ? 'e' : ''} personalizzata{customizedCount > 1 ? 'e' : ''}
          </p>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 text-sm font-medium text-cream-50 hover:bg-honey-600 disabled:opacity-40 transition-colors"
        >
          <Check size={16} />
          {isSaving ? 'Salvataggio…' : `Salva ispezioni (${hives.length})`}
        </button>
      </div>
    </div>
  )
}

// ── Per-hive edit sheet ──────────────────────────────────────────────────

function PerHiveEditSheet({
  hive,
  effectiveValues,
  onSave,
  onClose,
}: {
  hive: { id: string; identifier: string } | null
  effectiveValues: InspectionFormState
  onSave: (override: Partial<InspectionFormState>) => void
  onClose: () => void
}) {
  const form = useInspectionForm({ prefillState: effectiveValues })

  function handleSave() {
    const override: Partial<InspectionFormState> = {}
    for (const key of form.dirtyFields) {
      ;(override as any)[key] = form.state[key as keyof InspectionFormState]
    }
    onSave(override)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-wood-900/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Personalizza arnia ${hive?.identifier ?? ''}`}
        className="fixed inset-x-0 bottom-0 z-50 bg-cream-50 rounded-t-xl max-h-[80dvh] flex flex-col"
        style={{ boxShadow: '0 -12px 32px rgba(60, 40, 20, 0.18)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0 border-b border-cream-200">
          <h2 className="text-base font-semibold text-wood-800">
            Personalizza arnia {hive?.identifier}
          </h2>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={onClose}
            className="size-9 flex items-center justify-center text-wood-500 hover:text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Mode selector */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <SegmentedControl
            ariaLabel="Modalità ispezione"
            options={MODE_OPTIONS}
            value={form.mode}
            onChange={(v) => form.setMode(v as 'express' | 'standard')}
          />
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {form.mode === 'express' ? (
            <ExpressBody
              state={form.state}
              dirtyFields={form.dirtyFields}
              onUpdate={form.update}
              voiceNotes={[]}
              isRecording={false}
              canRecord={false}
              onStartRecording={() => {}}
              onStopRecording={() => {}}
              onPickAudioFile={() => {}}
              onDeleteVoiceNote={() => {}}
              disableVoiceAndMedia
            />
          ) : (
            <StandardBody
              state={form.state}
              dirtyFields={form.dirtyFields}
              onUpdate={form.update}
              voiceNotes={[]}
              isRecording={false}
              canRecord={false}
              onStartRecording={() => {}}
              onStopRecording={() => {}}
              onPickAudioFile={() => {}}
              onDeleteVoiceNote={() => {}}
              inspectionMedia={[]}
              pendingMedia={[]}
              mediaUploading={false}
              onMediaFilesSelected={() => {}}
              onRemoveMedia={() => {}}
              onRemovePendingMedia={() => {}}
              disableVoiceAndMedia
            />
          )}
        </div>

        {/* Action bar */}
        <div className="shrink-0 border-t border-cream-200 px-4 py-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-sm font-medium text-wood-700 hover:bg-cream-200 transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={form.dirtyFields.size === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 text-sm font-medium text-cream-50 hover:bg-honey-600 disabled:opacity-40 transition-colors"
          >
            <Check size={16} />
            Salva
          </button>
        </div>
      </div>
    </>
  )
}

// ── Per-hive note sheet ──────────────────────────────────────────────────

function PerHiveNoteSheet({
  hive,
  initialNote,
  onSave,
  onClose,
}: {
  hive: { id: string; identifier: string } | null
  initialNote: string
  onSave: (note: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState(initialNote)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-wood-900/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Nota per arnia ${hive?.identifier ?? ''}`}
        className="fixed inset-x-0 bottom-0 z-50 bg-cream-50 rounded-t-xl flex flex-col"
        style={{ boxShadow: '0 -12px 32px rgba(60, 40, 20, 0.18)' }}
      >
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
        </div>
        <div className="px-5 pt-3 pb-4">
          <h2 className="text-lg font-semibold text-wood-800 mb-1">
            Nota per arnia {hive?.identifier}
          </h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
            rows={4}
            placeholder="Scrivi una nota…"
            className="w-full bg-cream-50 border border-cream-200 rounded-md px-4 py-3 text-base text-wood-700 placeholder:text-wood-400 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20 resize-none mt-2"
          />
        </div>
        <div className="px-4 pb-4 flex gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center rounded-lg border border-cream-200 bg-cream-100 px-4 py-3 text-sm font-medium text-wood-700 hover:bg-cream-200 transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => onSave(note)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 text-sm font-medium text-cream-50 hover:bg-honey-600 transition-colors"
          >
            <Check size={16} />
            Salva nota
          </button>
        </div>
      </div>
    </>
  )
}
