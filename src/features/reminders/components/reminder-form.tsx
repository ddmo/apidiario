import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { ReminderFormData } from '../types'

interface ReminderFormProps {
  initialData?: Partial<ReminderFormData>
  title: string
  onSave: (data: ReminderFormData) => void
  onCancel: () => void
  isPending?: boolean
  /** Nasconde l'header interno (freccia + titolo) quando il form è incorporato in un pannello che fornisce già il proprio header. */
  hideHeader?: boolean
}

const SCOPE_OPTIONS = [
  { value: 'global', label: 'Globale' },
  { value: 'apiary', label: 'Apiario' },
  { value: 'hive', label: 'Arnia' },
] as const

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Una volta' },
  { value: 'weekly', label: 'Ogni settimana' },
  { value: 'monthly', label: 'Ogni mese' },
  { value: 'yearly', label: 'Ogni anno' },
] as const

function toDateInput(isoStr: string): string {
  return new Date(isoStr).toISOString().slice(0, 10)
}

function toEndOfDayIso(dateStr: string): string {
  const d = new Date(dateStr + 'T23:59:59')
  return d.toISOString()
}

export function ReminderForm({ initialData, title, onSave, onCancel, isPending, hideHeader }: ReminderFormProps) {
  const { showToast } = useToast()
  const isEdit = !!initialData?.title

  const [formTitle, setFormTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [dueAt, setDueAt] = useState(initialData?.due_at ? toDateInput(initialData.due_at) : '')
  const [recurrence, setRecurrence] = useState<string>(initialData?.recurrence ?? 'none')
  const [scope, setScope] = useState<string>(initialData?.scope ?? 'global')
  const [apiaryId, setApiaryId] = useState(initialData?.apiary_id ?? '')
  const [hiveId, setHiveId] = useState(initialData?.hive_id ?? '')

  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const markDirty = () => setIsDirty(true)

  const { data: apiaries = [] } = useQuery({
    queryKey: ['apiaries', 'for-reminder-form'],
    queryFn: async () => {
      const { data } = await supabase
        .from('apiaries')
        .select('id, name')
        .is('archived_at', null)
        .order('name')
      return data ?? []
    },
  })

  const { data: hives = [] } = useQuery({
    queryKey: ['hives', 'for-reminder-form', apiaryId],
    queryFn: async () => {
      if (!apiaryId) return []
      const { data } = await supabase
        .from('hives')
        .select('id, identifier')
        .eq('apiary_id', apiaryId)
        .order('identifier')
      return data ?? []
    },
    enabled: scope === 'hive' && !!apiaryId,
  })

  const apiaryOptions = apiaries.map((a) => ({ value: a.id, label: a.name }))

  function handleCancel() {
    if (isDirty) {
      setShowUnsaved(true)
    } else {
      onCancel()
    }
  }

  function doSubmit() {
    if (!formTitle.trim()) {
      showToast('Inserisci un titolo.', 'error')
      return
    }
    if (!dueAt) {
      showToast("Inserisci la scadenza.", 'error')
      return
    }
    if ((scope === 'apiary' || scope === 'hive') && !apiaryId) {
      showToast("Seleziona l'apiario.", 'error')
      return
    }
    if (scope === 'hive' && !hiveId) {
      showToast("Seleziona l'arnia.", 'error')
      return
    }

    onSave({
      title: formTitle.trim(),
      description: description.trim() || '',
      due_at: toEndOfDayIso(dueAt),
      recurrence: recurrence as ReminderFormData['recurrence'],
      scope: scope as ReminderFormData['scope'],
      apiary_id: (scope === 'apiary' || scope === 'hive') ? apiaryId : '',
      hive_id: scope === 'hive' ? hiveId : '',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
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
            <h1 className="font-display text-2xl font-medium text-wood-800 truncate tracking-tight">
              {title}
            </h1>
          </div>
        </header>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <div className={`flex flex-col gap-5${hideHeader ? ' tablet:max-w-lg tablet:mx-auto' : ''}`}>
          {/* Titolo */}
          <Input
            id="reminder-title"
            label="Titolo"
            placeholder="es. Somministrazione acido ossalico"
            value={formTitle}
            onChange={(e) => { setFormTitle(e.target.value); markDirty() }}
            required
            maxLength={200}
          />

          {/* Descrizione */}
          <div>
            <label htmlFor="reminder-desc" className="text-sm font-medium text-wood-700 mb-1.5 block">
              Descrizione <span className="text-wood-400 font-normal">(opzionale)</span>
            </label>
            <textarea
              id="reminder-desc"
              rows={3}
              placeholder="Note sul promemoria..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty() }}
              className="w-full bg-cream-50 border border-cream-200 rounded-md px-4 py-3 text-sm text-wood-700 placeholder:text-wood-400 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20 resize-none transition-colors"
            />
          </div>

          {/* Scadenza */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reminder-due" className="text-sm font-medium text-wood-700">
              Scadenza
            </label>
            <input
              id="reminder-due"
              type="date"
              value={dueAt}
              onChange={(e) => { setDueAt(e.target.value); markDirty() }}
              required
              className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
            />
          </div>

          {/* Ricorrenza */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reminder-recurrence" className="text-sm font-medium text-wood-700">
              Ricorrenza
            </label>
            <select
              id="reminder-recurrence"
              value={recurrence}
              onChange={(e) => { setRecurrence(e.target.value); markDirty() }}
              className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Ambito */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reminder-scope" className="text-sm font-medium text-wood-700">
              Riguarda
            </label>
            <select
              id="reminder-scope"
              value={scope}
              onChange={(e) => { setScope(e.target.value); setApiaryId(''); setHiveId(''); markDirty() }}
              className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Apiario (solo se scope = apiary o hive) */}
          {(scope === 'apiary' || scope === 'hive') && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reminder-apiary" className="text-sm font-medium text-wood-700">
                Apiario
              </label>
              <select
                id="reminder-apiary"
                value={apiaryId}
                onChange={(e) => { setApiaryId(e.target.value); setHiveId(''); markDirty() }}
                className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
              >
                <option value="">Seleziona apiario</option>
                {apiaryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Arnia (solo se scope = hive) */}
          {scope === 'hive' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reminder-hive" className="text-sm font-medium text-wood-700">
                Arnia
              </label>
              <select
                id="reminder-hive"
                value={hiveId}
                onChange={(e) => { setHiveId(e.target.value); markDirty() }}
                className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
              >
                <option value="">
                  {apiaryId ? 'Seleziona arnia' : 'Seleziona prima un apiario'}
                </option>
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>{h.identifier}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="sticky bottom-0 bg-cream-50/95 backdrop-blur-sm border-t border-cream-200 px-4 py-3 shrink-0"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className={`flex items-center gap-2${hideHeader ? ' tablet:max-w-lg tablet:mx-auto' : ''}`}>
          <Button type="button" variant="secondary" size="md" className="flex-none px-4" onClick={handleCancel}>
            Annulla
          </Button>
          <Button type="button" variant="primary" size="md" className="flex-1" onClick={doSubmit} loading={isPending} disabled={isEdit && !isDirty}>
            {isEdit ? 'Salva modifiche' : 'Salva promemoria'}
          </Button>
        </div>
      </div>

      {/* Unsaved changes sheet */}
      {showUnsaved && (
        <>
          <div
            className="fixed inset-0 z-30 bg-wood-900/40"
            onClick={() => setShowUnsaved(false)}
            aria-hidden="true"
          />
          <div role="dialog" aria-modal="true" aria-label="Modifiche non salvate" className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg animate-slide-up">
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
