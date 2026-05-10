import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useApiaries } from '@/features/apiaries/hooks/use-apiaries'
import { useHivesByApiary } from '@/features/hives/hooks/use-hives'
import { useToast } from '@/hooks/use-toast'
import type { TreatmentDetail } from '../hooks/use-treatments'

interface TreatmentFormProps {
  userId: string
  prefillApiaryId?: string | null
  treatment?: TreatmentDetail
  onSave: (data: TreatmentFormData) => void
  onCancel: () => void
  isPending?: boolean
}

export type TreatmentFormData = {
  apiaryId: string
  productName: string
  blocksMelari: boolean
  appliesToAllHives: boolean
  startDate: string
  endDate: string | null
  dosageNotes: string | null
  costEur: number | null
  notes: string | null
  hiveIds: string[]
}

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Tutto apiario' },
  { value: 'specific', label: 'Arnie specifiche' },
]

export function TreatmentForm({ userId: _userId, prefillApiaryId, treatment, onSave, onCancel, isPending }: TreatmentFormProps) {
  const isEdit = !!treatment
  const { showToast } = useToast()
  const { data: apiaries = [] } = useApiaries()

  const [apiaryId, setApiaryId] = useState(treatment?.apiaryId ?? prefillApiaryId ?? '')
  const [scope, setScope] = useState(treatment?.appliesToAllHives ? 'all' : 'specific')
  const [productName, setProductName] = useState(treatment?.productName ?? '')
  const [blocksMelari, setBlocksMelari] = useState(treatment?.blocksMelari ?? true)
  const [startDate, setStartDate] = useState(treatment?.startDate ?? '')
  const [endDate, setEndDate] = useState(treatment?.endDate ?? '')
  const [dosageNotes, setDosageNotes] = useState(treatment?.dosageNotes ?? '')
  const [costEur, setCostEur] = useState(treatment?.costEur != null ? String(treatment.costEur) : '')
  const [notes, setNotes] = useState(treatment?.notes ?? '')
  const [hiveIds, setHiveIds] = useState<string[]>(treatment?.hives.map((h) => h.hiveId) ?? [])

  const { data: hives = [] } = useHivesByApiary(apiaryId)

  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const markDirty = () => setIsDirty(true)

  const apiaryOptions = apiaries.map((a) => ({ value: a.id, label: a.name }))

  function toggleHive(hiveId: string) {
    setHiveIds((prev) =>
      prev.includes(hiveId) ? prev.filter((id) => id !== hiveId) : [...prev, hiveId],
    )
    markDirty()
  }

  function handleCancel() {
    if (isDirty) {
      setShowUnsaved(true)
    } else {
      onCancel()
    }
  }

  function doSubmit() {
    if (!apiaryId || !productName.trim() || !startDate) {
      showToast('Compila apiario, prodotto e data inizio.', 'error')
      return
    }
    if (scope === 'specific' && hiveIds.length === 0) {
      showToast('Seleziona almeno un\'arnia.', 'error')
      return
    }

    onSave({
      apiaryId,
      productName: productName.trim(),
      blocksMelari,
      appliesToAllHives: scope === 'all',
      startDate,
      endDate: endDate || null,
      dosageNotes: dosageNotes.trim() || null,
      costEur: costEur ? Number(costEur) : null,
      notes: notes.trim() || null,
      hiveIds: scope === 'all' ? [] : hiveIds,
    })
  }

  // Reset hiveIds when scope changes to 'all'
  useEffect(() => {
    if (scope === 'all') setHiveIds([])
  }, [scope])

  return (
    <div className="flex flex-col h-full">
      <header className="bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Indietro"
          onClick={handleCancel}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0 px-1">
          <h1 className="text-base font-semibold text-wood-800 truncate tracking-tight">
            {isEdit ? 'Modifica trattamento' : 'Nuovo trattamento'}
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <div className="flex flex-col gap-5">
          {/* Apiario */}
          <Select
            id="treatment-apiary"
            label="Apiario"
            options={apiaryOptions}
            value={apiaryId}
            onChange={(e) => { setApiaryId(e.target.value); markDirty() }}
            disabled={isEdit || !!prefillApiaryId}
          />

          {/* Ambito */}
          <div>
            <label className="block text-sm font-medium text-wood-600 mb-1.5">Riguarda</label>
            <SegmentedControl
              options={SCOPE_OPTIONS}
              value={scope}
              onChange={(v) => { setScope(v); markDirty() }}
              ariaLabel="Ambito trattamento"
            />
          </div>

          {/* Selezione arnie (solo se ambito specifico) */}
          {scope === 'specific' && apiaryId && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-wood-700">Arnie</p>
              {hives.length === 0 ? (
                <p className="text-xs text-wood-400">Nessuna arnia in questo apiario.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {hives.map((hive) => (
                    <label
                      key={hive.id}
                      className="flex items-center gap-3 px-3 py-2 bg-cream-50 border border-cream-200 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={hiveIds.includes(hive.id)}
                        onChange={() => toggleHive(hive.id)}
                        className="size-4 rounded border-cream-300 text-honey-500 focus:ring-honey-500"
                      />
                      <span className="text-sm text-wood-800">{hive.identifier}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prodotto */}
          <Input
            id="treatment-product"
            label="Prodotto"
            placeholder="es. Apivar, Api-Bioxal..."
            value={productName}
            onChange={(e) => { setProductName(e.target.value); markDirty() }}
            required
          />

          {/* Blocco melari */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={blocksMelari}
              onChange={(e) => { setBlocksMelari(e.target.checked); markDirty() }}
              className="size-4 rounded border-cream-300 text-honey-500 focus:ring-honey-500"
            />
            <span className="text-sm text-wood-700">Blocca melari</span>
          </label>
          {blocksMelari && (
            <p className="text-xs text-wood-400 -mt-3">
              Durante il trattamento, l&rsquo;app avviser&agrave; se aggiungi melari alle arnie coinvolte.
            </p>
          )}

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="treatment-start" className="text-sm font-medium text-wood-700">
              Data inizio
            </label>
            <input
              id="treatment-start"
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); markDirty() }}
              required
              className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="treatment-end" className="text-sm font-medium text-wood-700">
              Data fine <span className="text-wood-400 font-normal">(opzionale)</span>
            </label>
            <input
              id="treatment-end"
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); markDirty() }}
              min={startDate || undefined}
              className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
            />
          </div>

          {/* Dosaggio */}
          <Input
            id="treatment-dosage"
            label="Dosaggio"
            placeholder="es. 2 strisce per arnia"
            value={dosageNotes}
            onChange={(e) => { setDosageNotes(e.target.value); markDirty() }}
          />

          {/* Costo */}
          <Input
            id="treatment-cost"
            label="Costo (€)"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={costEur}
            onChange={(e) => { setCostEur(e.target.value); markDirty() }}
          />

          {/* Note */}
          <div>
            <label htmlFor="treatment-notes" className="text-sm font-medium text-wood-700 mb-1.5 block">
              Note
            </label>
            <textarea
              id="treatment-notes"
              rows={4}
              placeholder="Note sul trattamento..."
              value={notes}
              onChange={(e) => { setNotes(e.target.value); markDirty() }}
              className="w-full bg-cream-50 border border-cream-200 rounded-md px-4 py-3 text-sm text-wood-700 placeholder:text-wood-400 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20 resize-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="sticky bottom-0 bg-cream-50/95 backdrop-blur-sm border-t border-cream-200 px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <Button type="button" variant="ghost" size="md" className="flex-none px-4" onClick={handleCancel}>
          Annulla
        </Button>
        <Button type="button" variant="primary" size="md" className="flex-1" onClick={doSubmit} loading={isPending}>
          {isEdit ? 'Salva modifiche' : 'Salva trattamento'}
        </Button>
      </div>

      {/* Unsaved changes sheet */}
      {showUnsaved && (
        <>
          <div
            className="fixed inset-0 z-30 bg-wood-900/40"
            onClick={() => setShowUnsaved(false)}
            aria-hidden="true"
          />
          <div role="dialog" aria-modal="true" aria-label="Modifiche non salvate" className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg">
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">Modifiche non salvate</h2>
              <p className="text-sm text-wood-500 leading-relaxed">Vuoi salvare prima di uscire?</p>
            </div>
            <div className="px-4 flex flex-col gap-2" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              <Button variant="primary" size="lg" onClick={() => { setShowUnsaved(false); doSubmit() }} className="w-full">
                Salva
              </Button>
              <Button variant="secondary" size="lg" onClick={onCancel} className="w-full">
                Esci senza salvare
              </Button>
              <Button variant="ghost" size="md" onClick={() => setShowUnsaved(false)} className="w-full">
                Annulla
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
