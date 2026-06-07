import { useState, useRef, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FrameCounter } from '@/features/inspections/components/frame-counter'
import { MainPhotoSlot } from '@/components/ui/main-photo-slot'
import { useHivesByApiary, useCreateHive, useUpdateHive, useUpsertQueen } from '../hooks/use-hives'
import { QUEEN_COLORS, queenColorFromYear } from '../queen-color'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'
import type { Database } from '@/types/database'

type HiveType = Database['public']['Enums']['hive_type']
type BeeRace = Database['public']['Enums']['bee_race']

const HIVE_TYPE_OPTIONS = (
  Object.entries(t.hive.hiveTypeLabels) as [HiveType, string][]
).map(([value, label]) => ({ value, label }))

const BEE_RACE_OPTIONS = (
  Object.entries(t.hive.beeRaceLabels) as [BeeRace, string][]
).map(([value, label]) => ({ value, label }))

interface HiveFormProps {
  apiaryId: string
  userId: string
  onSuccess: () => void
  onCancel: () => void
  apiaries?: { id: string; name: string }[]
  photoUrl?: string | null
  queenData?: { marking_color: string | null; birth_year: number | null } | null
  hive?: {
    id: string
    identifier: string
    hive_type: HiveType
    bee_race: BeeRace
    installed_on: string | null
    origin_notes: string | null
    nido_frame_count: number
    notes: string | null
  }
}

export function HiveForm({ apiaryId, apiaries, photoUrl, queenData, hive, onSuccess, onCancel }: HiveFormProps) {
  const isEdit = !!hive
  const { showToast } = useToast()
  const { mutate: createHive, isPending: creating } = useCreateHive()
  const { mutate: updateHive, isPending: updating } = useUpdateHive()
  const { mutate: upsertQueen, isPending: queenPending } = useUpsertQueen()
  const isPending = creating || updating || queenPending
  const { data: existingHives, isLoading: hivesLoading } = useHivesByApiary(apiaryId)

  const [identifier, setIdentifier] = useState(hive?.identifier ?? '')
  const [hiveType, setHiveType] = useState<HiveType>(hive?.hive_type ?? 'dadant_blatt')
  const [beeRace, setBeeRace] = useState<BeeRace>(hive?.bee_race ?? 'ligustica')
  const [installedOn, setInstalledOn] = useState(hive?.installed_on ?? '')
  const [originNotes, setOriginNotes] = useState(hive?.origin_notes ?? '')
  const [nidoFrameCount, setNidoFrameCount] = useState(hive?.nido_frame_count ?? 10)
  const [notes, setNotes] = useState(hive?.notes ?? '')
  const [selectedApiaryId, setSelectedApiaryId] = useState(apiaryId)

  // Queen
  const [queenColor, setQueenColor] = useState<string>(queenData?.marking_color ?? '')
  const [queenBirthYear, setQueenBirthYear] = useState<string>(
    queenData?.birth_year ? String(queenData.birth_year) : ''
  )

  useEffect(() => {
    if (queenData) {
      setQueenColor(queenData.marking_color ?? '')
      setQueenBirthYear(queenData.birth_year ? String(queenData.birth_year) : '')
    }
  }, [queenData])

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(photoUrl ?? null)
  const [photoRemoved, setPhotoRemoved] = useState(false)

  useEffect(() => {
    if (photoUrl && !photoFile && !photoRemoved) {
      setPhotoPreviewUrl(photoUrl)
    }
  }, [photoUrl, photoFile, photoRemoved])

  useEffect(() => {
    return () => {
      if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    }
  }, [photoPreviewUrl])

  function handlePhotoPick() {
    fileInputRef.current?.click()
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      showToast('La foto non deve superare 10 MB.', 'error')
      return
    }
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
    setPhotoRemoved(false)
    markDirty()
  }

  function handlePhotoRemove() {
    setPhotoFile(null)
    if (photoPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoPreviewUrl(null)
    setPhotoRemoved(true)
    markDirty()
  }

  const [identifierError, setIdentifierError] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const markDirty = () => setIsDirty(true)

  const handleCancel = () => {
    if (isDirty) {
      setShowUnsaved(true)
    } else {
      onCancel()
    }
  }

  const doSubmit = () => {
    const trimmed = identifier.trim()

    if (!trimmed) {
      setIdentifierError(t.hive.new.identifierRequired)
      return
    }

    const duplicate = existingHives?.some(
      (h) => h.identifier.toLowerCase() === trimmed.toLowerCase() && h.id !== hive?.id,
    )
    if (duplicate) {
      setIdentifierError(t.hive.new.identifierDuplicate)
      return
    }

    setIdentifierError('')

    if (isEdit && hive) {
      updateHive(
        {
          hiveId: hive.id,
          apiaryId: selectedApiaryId,
          identifier: trimmed,
          hiveType,
          beeRace,
          installedOn: installedOn || null,
          originNotes: originNotes.trim() || null,
          nidoFrameCount,
          notes: notes.trim() || null,
          photoFile: photoFile ?? undefined,
          removePhoto: photoRemoved || undefined,
        },
        {
          onSuccess: () => {
            upsertQueen({
              hiveId: hive.id,
              markingColor: queenColor || null,
              birthYear: queenBirthYear ? parseInt(queenBirthYear, 10) || null : null,
            }, {
              onSuccess: () => {
                showToast('Arnia aggiornata', 'success')
                onSuccess()
              },
              onError: () => showToast(t.hive.new.errorSave, 'error'),
            })
          },
          onError: () => showToast(t.hive.new.errorSave, 'error'),
        },
      )
    } else {
      createHive(
        {
          apiaryId,
          identifier: trimmed,
          hiveType,
          beeRace,
          installedOn: installedOn || null,
          originNotes: originNotes.trim() || null,
          nidoFrameCount,
          notes: notes.trim() || null,
        },
        {
          onSuccess: () => {
            showToast(t.hive.new.saved, 'success')
            onSuccess()
          },
          onError: () => showToast(t.hive.new.errorSave, 'error'),
        },
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nav header */}
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
            {isEdit ? 'Modifica arnia' : t.hive.new.title}
          </h1>
        </div>
      </header>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <div className="flex flex-col gap-5">

          {/* Foto */}
          <section>
            <MainPhotoSlot
              previewUrl={photoPreviewUrl}
              onPick={handlePhotoPick}
              onChange={handlePhotoPick}
              onRemove={handlePhotoRemove}
              aspect="4/3"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </section>

          {/* Identificazione */}
          <section className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-1">
              {t.hive.new.sectionIdentity}
            </div>
            <Input
              id="hive-identifier"
              label={t.hive.new.identifierLabel}
              placeholder={t.hive.new.identifierPlaceholder}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); markDirty() }}
              error={identifierError || undefined}
              required
              autoComplete="off"
              autoCapitalize="words"
              maxLength={50}
            />
            {isEdit && apiaries && apiaries.length > 1 && (
              <Select
                id="hive-apiary"
                label="Apiario"
                options={apiaries.map((a) => ({ value: a.id, label: a.name }))}
                value={selectedApiaryId}
                onChange={(e) => { setSelectedApiaryId(e.target.value); markDirty() }}
              />
            )}
          </section>

          {/* Tipo e razza */}
          <section className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-1">
              {t.hive.new.sectionDetails}
            </div>
            <Select
              id="hive-type"
              label={t.hive.new.hiveTypeLabel}
              options={HIVE_TYPE_OPTIONS}
              value={hiveType}
              onChange={(e) => { setHiveType(e.target.value as HiveType); markDirty() }}
            />
            <Select
              id="hive-bee-race"
              label={t.hive.new.beeRaceLabel}
              options={BEE_RACE_OPTIONS}
              value={beeRace}
              onChange={(e) => { setBeeRace(e.target.value as BeeRace); markDirty() }}
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="hive-installed-on"
                className="text-sm font-medium text-wood-700"
              >
                {t.hive.new.installedOnLabel}
              </label>
              <input
                id="hive-installed-on"
                type="date"
                value={installedOn}
                onChange={(e) => { setInstalledOn(e.target.value); markDirty() }}
                className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
              />
            </div>
            <Input
              id="hive-origin-notes"
              label={t.hive.new.originNotesLabel}
              placeholder={t.hive.new.originNotesPlaceholder}
              value={originNotes}
              onChange={(e) => { setOriginNotes(e.target.value); markDirty() }}
              autoComplete="off"
            />
          </section>

          {/* Favi nido */}
          <section>
            <div className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-3">
              {t.hive.new.nidoFrameCountLabel}
            </div>
            <FrameCounter
              label={t.hive.new.nidoFrameCountLabel}
              value={nidoFrameCount}
              onChange={(v) => { setNidoFrameCount(v); markDirty() }}
              min={1}
              max={30}
              dirty={isDirty}
            />
          </section>

          {/* Regina */}
          <section>
            <div className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-3">
              Regina
            </div>
            <div className="flex flex-col gap-3">
              <Select
                id="queen-color"
                label="Colore marcatura"
                options={[
                  { value: '', label: 'Non impostato' },
                  ...QUEEN_COLORS.map((c) => ({ value: c.value, label: `${c.label} (${c.yearEndings})` })),
                ]}
                value={queenColor}
                onChange={(e) => { setQueenColor(e.target.value); markDirty() }}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="queen-birth-year" className="text-sm font-medium text-wood-700">
                  Anno di nascita
                </label>
                <input
                  id="queen-birth-year"
                  type="number"
                  min={2000}
                  max={2099}
                  placeholder="es. 2026"
                  value={queenBirthYear}
                  onChange={(e) => { setQueenBirthYear(e.target.value); markDirty() }}
                  className="h-12 rounded-md border border-cream-200 bg-cream-50 px-4 text-base text-wood-700 transition-colors duration-150 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20"
                />
                {queenBirthYear && queenColor === '' && (() => {
                  const y = parseInt(queenBirthYear, 10)
                  if (isNaN(y)) return null
                  const derived = queenColorFromYear(y)
                  if (!derived) return null
                  const label = QUEEN_COLORS.find((c) => c.value === derived)?.label
                  return (
                    <p className="text-xs text-wood-400">
                      Colore calcolato dall'anno: <span className="inline-block size-2 rounded-full align-middle" style={{ backgroundColor: QUEEN_COLORS.find((c) => c.value === derived)?.hex }} /> {label}
                    </p>
                  )
                })()}
              </div>
            </div>
          </section>

          {/* Note */}
          <section>
            <label
              htmlFor="hive-notes"
              className="text-sm font-medium text-wood-700 mb-1.5 block"
            >
              {t.hive.new.notesLabel}
            </label>
            <textarea
              id="hive-notes"
              rows={4}
              placeholder={t.hive.new.notesPlaceholder}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); markDirty() }}
              className="w-full bg-cream-50 border border-cream-200 rounded-md px-4 py-3 text-sm text-wood-700 placeholder:text-wood-400 focus:border-honey-500 focus:outline-none focus:ring-2 focus:ring-honey-500/20 resize-none transition-colors"
            />
            {notes && (
              <p className="mt-1 text-xs text-wood-400">{notes.length} caratteri</p>
            )}
          </section>

        </div>
      </div>

      {/* Sticky CTA bar */}
      <div
        className="sticky bottom-0 bg-cream-50/95 backdrop-blur-sm border-t border-cream-200 px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <Button
          type="button"
          variant="ghost"
          size="md"
          className="flex-none px-4"
          onClick={handleCancel}
        >
          {t.hive.new.cancel}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="flex-1"
          onClick={doSubmit}
          loading={isPending}
          disabled={hivesLoading}
        >
          {isEdit ? 'Salva modifiche' : t.hive.new.save}
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
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.hive.new.unsavedTitle}
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg animate-slide-up"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">
                {t.hive.new.unsavedTitle}
              </h2>
              <p className="text-sm text-wood-500 leading-relaxed">{t.hive.new.unsavedBody}</p>
            </div>
            <div
              className="px-4 flex flex-col gap-2"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => { setShowUnsaved(false); doSubmit() }}
                className="w-full"
              >
                {t.hive.new.unsavedSave}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={onCancel}
                className="w-full"
              >
                {t.hive.new.unsavedDiscard}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowUnsaved(false)}
                className="w-full"
              >
                {t.hive.new.unsavedCancel}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
