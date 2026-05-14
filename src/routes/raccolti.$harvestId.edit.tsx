import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { ArrowLeft, Save, Droplet, Trees, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHarvest, useUpdateHarvest, useDeleteHarvest } from '@/features/harvests/hooks/use-harvests'
import { HONEY_TYPES } from '@/features/harvests/honey-types'
import { useApiaries } from '@/features/apiaries/hooks/use-apiaries'

export const Route = createFileRoute('/raccolti/$harvestId/edit')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: EditRaccoltoPage,
})

function EditRaccoltoPage() {
  const { harvestId } = Route.useParams()
  const navigate = useNavigate()
  const { data: harvest, isLoading } = useHarvest(harvestId)
  const updateHarvest = useUpdateHarvest()
  const deleteHarvest = useDeleteHarvest()
  const { data: apiaries } = useApiaries()

  const [apiaryId, setApiaryId] = useState('')
  const [date, setDate] = useState('')
  const [honeyType, setHoneyType] = useState('')
  const [totalKg, setTotalKg] = useState('')
  const [humidityPct, setHumidityPct] = useState('')
  const [batchCode, setBatchCode] = useState('')
  const [notes, setNotes] = useState('')
  const [showApiaryPicker, setShowApiaryPicker] = useState(false)
  const [showHoneyPicker, setShowHoneyPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (harvest && !initialized) {
    setInitialized(true)
    setApiaryId(harvest.apiary_id)
    setDate(harvest.harvested_on)
    setHoneyType(harvest.honey_type)
    setTotalKg(String(harvest.total_kg))
    setHumidityPct(harvest.humidity_pct != null ? String(harvest.humidity_pct) : '')
    setBatchCode(harvest.batch_code ?? '')
    setNotes(harvest.notes ?? '')
  }

  const selectedApiary = apiaries?.find((a) => a.id === apiaryId)

  const handleSave = useCallback(async () => {
    if (!apiaryId || !totalKg || !honeyType) return
    setSaving(true)
    try {
      await updateHarvest.mutateAsync({
        id: harvestId,
        apiary_id: apiaryId,
        harvested_on: date,
        honey_type: honeyType,
        total_kg: parseFloat(totalKg.replace(',', '.')),
        humidity_pct: humidityPct ? parseFloat(humidityPct.replace(',', '.')) : null,
        batch_code: batchCode || null,
        notes: notes || null,
      })
      navigate({ to: '/raccolti' })
    } catch {
      // error handled by useMutation
    } finally {
      setSaving(false)
    }
  }, [apiaryId, date, honeyType, totalKg, humidityPct, batchCode, notes, harvestId, updateHarvest, navigate])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await deleteHarvest.mutateAsync(harvestId)
      navigate({ to: '/raccolti' })
    } catch {
      // error handled
    } finally {
      setDeleting(false)
    }
  }, [harvestId, deleteHarvest, navigate])

  if (isLoading) {
    return (
      <main className="min-h-dvh px-4 py-6">
        <p className="text-sm text-wood-400">Caricamento…</p>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col bg-cream-50">
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ to: '/raccolti' })}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight flex-1 px-1">
          Modifica raccolto
        </h1>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="size-11 flex items-center justify-center text-danger-500 hover:bg-danger-100 rounded-md transition-colors"
        >
          <span className="text-sm font-medium">Elimina</span>
        </button>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto">

        <div className="flex flex-col gap-5">
          {/* Apiario */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-wood-700">Apiario *</label>
            <button
              type="button"
              onClick={() => setShowApiaryPicker(true)}
              className="flex items-center gap-2 rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-left text-sm text-wood-800 hover:bg-cream-100 transition-colors"
            >
              <Trees size={16} className="text-wood-400 shrink-0" />
              <span className={selectedApiary ? '' : 'text-wood-400'}>
                {selectedApiary ? selectedApiary.name : 'Seleziona apiario…'}
              </span>
            </button>
          </div>

          {/* Data */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-wood-700">Data raccolto *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-wood-800"
            />
          </div>

          {/* Tipo miele */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-wood-700">Tipo di miele *</label>
            <button
              type="button"
              onClick={() => setShowHoneyPicker(true)}
              className="flex items-center gap-2 rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-left text-sm text-wood-800 hover:bg-cream-100 transition-colors"
            >
              <Droplet size={16} className="text-wood-400 shrink-0" />
              <span className={honeyType ? '' : 'text-wood-400'}>
                {honeyType || 'Seleziona tipo…'}
              </span>
            </button>
          </div>

          {/* Kg totali */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-wood-700">Kg totali *</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.1"
              placeholder="es. 14,5"
              value={totalKg}
              onChange={(e) => setTotalKg(e.target.value)}
              className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-wood-800"
            />
          </div>

          {/* Umidità */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-wood-500">Umidità % (opzionale)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="100"
              placeholder="es. 17,5"
              value={humidityPct}
              onChange={(e) => setHumidityPct(e.target.value)}
              className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-wood-800"
            />
          </div>

          {/* Codice lotto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-wood-500">Codice lotto (opzionale)</label>
            <input
              type="text"
              placeholder="es. A-001"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-wood-800"
            />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-wood-500">Note (opzionale)</label>
            <textarea
              rows={3}
              placeholder="Colore, aroma, condizioni del raccolto…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-wood-800 resize-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !apiaryId || !totalKg || !honeyType}
          className="mt-8 w-full flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 text-sm font-medium text-cream-50 hover:bg-honey-600 disabled:opacity-40 transition-colors"
        >
          <Save size={16} />
          {saving ? 'Salvataggio…' : 'Salva modifiche'}
        </button>
      </div>
      </div>

      {/* Apiary picker */}
      {showApiaryPicker && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowApiaryPicker(false)} />
          <div className="relative w-full rounded-t-xl bg-cream-50 px-4 pb-8 pt-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-wood-700">Seleziona apiario</h3>
              <button type="button" onClick={() => setShowApiaryPicker(false)}>
                <X size={18} className="text-wood-400" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {apiaries?.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setApiaryId(a.id); setShowApiaryPicker(false) }}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                    apiaryId === a.id
                      ? 'bg-honey-500/10 text-wood-800'
                      : 'hover:bg-cream-100 text-wood-600'
                  }`}
                >
                  <Trees size={16} className="text-wood-400 shrink-0" />
                  <span className="font-medium">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Honey type picker */}
      {showHoneyPicker && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowHoneyPicker(false)} />
          <div className="relative w-full rounded-t-xl bg-cream-50 px-4 pb-8 pt-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-wood-700">Seleziona tipo miele</h3>
              <button type="button" onClick={() => setShowHoneyPicker(false)}>
                <X size={18} className="text-wood-400" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {HONEY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setHoneyType(type); setShowHoneyPicker(false) }}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                    honeyType === type
                      ? 'bg-honey-500/10 text-wood-800'
                      : 'hover:bg-cream-100 text-wood-600'
                  }`}
                >
                  <Droplet size={16} className="text-wood-400 shrink-0" />
                  <span className="font-medium">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full rounded-t-xl bg-cream-50 px-4 pb-8 pt-4">
            <h3 className="text-sm font-medium text-wood-800 mb-2">Eliminare questo raccolto?</h3>
            <p className="text-xs text-wood-500 mb-4">
              Questa azione non può essere annullata.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-cream-200 px-4 py-2.5 text-sm font-medium text-wood-700 hover:bg-cream-100 transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-danger-500 px-4 py-2.5 text-sm font-medium text-cream-50 hover:bg-danger-500/80 disabled:opacity-40 transition-colors"
              >
                {deleting ? 'Eliminazione…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
