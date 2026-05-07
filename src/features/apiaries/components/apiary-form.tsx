import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MainPhotoSlot } from '@/components/ui/main-photo-slot'
import { LocationPreview } from '@/components/ui/location-preview'
import { useCreateApiary } from '../hooks/use-apiaries'
import { useGeolocation } from '../hooks/use-geolocation'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'

type Location = { lat: number; lng: number }

interface ApiaryFormProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export function ApiaryForm({ userId, onSuccess, onCancel }: ApiaryFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()
  const { mutate: createApiary, isPending } = useCreateApiary()
  const { state: geoState, request: requestLocation } = useGeolocation()

  // Form fields
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [bdaCode, setBdaCode] = useState('')
  const [location, setLocation] = useState<Location | null>(null)
  const [showCoordEditor, setShowCoordEditor] = useState(false)
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [nameError, setNameError] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const markDirty = () => setIsDirty(true)

  // Sync location from geolocation hook when it succeeds
  useEffect(() => {
    if (geoState.status === 'success') {
      setLocation({ lat: geoState.lat, lng: geoState.lng })
      setLatInput(geoState.lat.toFixed(6))
      setLngInput(geoState.lng.toFixed(6))
      setShowCoordEditor(false)
      markDirty()
    }
  }, [geoState])

  // ── Photo ────────────────────────────────────────────────────

  const handleFileSelected = async (file: File) => {
    markDirty()
    setPhotoPreviewUrl(URL.createObjectURL(file))
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      setPhotoFile(compressed)
    } catch {
      setPhotoFile(file) // fallback: use original
    }
  }

  const handlePickPhoto = () => fileInputRef.current?.click()

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    markDirty()
  }

  // ── Location ─────────────────────────────────────────────────

  const handleConfirmCoords = () => {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setLocation({ lat, lng })
      setShowCoordEditor(false)
    }
  }

  // ── Cancel / unsaved ─────────────────────────────────────────

  const handleCancel = () => {
    if (isDirty) {
      setShowUnsaved(true)
    } else {
      onCancel()
    }
  }

  // ── Submit ───────────────────────────────────────────────────

  const doSubmit = () => {
    if (!name.trim()) {
      setNameError(t.apiary.new.nameRequired)
      return
    }
    setNameError('')

    createApiary(
      {
        name: name.trim(),
        bda_codice_aziendale: bdaCode.trim() || null,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        photoFile,
        userId,
      },
      {
        onSuccess: (result) => {
          if (result.photoFailed) {
            showToast(t.apiary.new.errorPhoto, 'error')
          } else {
            showToast(t.apiary.new.saved, 'success')
          }
          onSuccess()
        },
        onError: () => showToast(t.apiary.new.errorSave, 'error'),
      },
    )
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await handleFileSelected(file)
        }}
      />

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
          <h1 className="text-base font-semibold text-wood-800 truncate tracking-tight">
            {t.apiary.new.title}
          </h1>
        </div>
      </header>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <div className="flex flex-col gap-5">

          {/* Foto */}
          <section>
            <div className="text-xs uppercase tracking-wider font-semibold text-wood-500 mb-2">
              {t.apiary.new.sectionPhoto}
            </div>
            <MainPhotoSlot
              previewUrl={photoPreviewUrl}
              onPick={handlePickPhoto}
              onChange={handlePickPhoto}
              onRemove={handleRemovePhoto}
            />
          </section>

          {/* Identità */}
          <section className="flex flex-col gap-3">
            <Input
              id="apiary-name"
              label={t.apiary.new.nameLabel}
              placeholder={t.apiary.new.namePlaceholder}
              value={name}
              onChange={(e) => { setName(e.target.value); markDirty() }}
              error={nameError || undefined}
              required
              autoComplete="off"
              autoCapitalize="words"
            />
            <Input
              id="apiary-bda"
              label={t.apiary.new.bdaLabel}
              placeholder={t.apiary.new.bdaPlaceholder}
              value={bdaCode}
              onChange={(e) => { setBdaCode(e.target.value.toUpperCase()); markDirty() }}
              autoComplete="off"
              autoCapitalize="characters"
            />
            {bdaCode && (
              <p className="text-xs text-wood-400 -mt-1.5">{t.apiary.new.bdaHint}</p>
            )}
          </section>

          {/* Posizione */}
          <section>
            <div className="text-sm font-medium text-wood-700 mb-2">
              {t.apiary.new.sectionLocation}
            </div>

            {/* No location yet, not editing manually */}
            {!location && !showCoordEditor && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={requestLocation}
                  loading={geoState.status === 'loading'}
                  disabled={geoState.status === 'loading'}
                >
                  <MapPin size={18} strokeWidth={1.75} aria-hidden="true" />
                  {t.apiary.new.useLocationBtn}
                </Button>
                {geoState.status === 'denied' && (
                  <p className="text-xs text-danger-500 leading-relaxed">
                    Permesso negato. Vai in Impostazioni → Safari → Posizione e consenti l'accesso, poi riprova.
                  </p>
                )}
                {geoState.status === 'error' && (
                  <p className="text-xs text-danger-500">
                    Impossibile ottenere la posizione. Inserisci manualmente.
                  </p>
                )}
                {geoState.status === 'idle' && (
                  <p className="text-xs text-wood-400">{t.apiary.new.locationRationale}</p>
                )}
                <button
                  type="button"
                  className="self-start text-xs font-medium text-honey-600 hover:text-honey-700 transition-colors"
                  onClick={() => { setShowCoordEditor(true); markDirty() }}
                >
                  Inserisci manualmente
                </button>
              </div>
            )}

            {/* Location set, preview mode */}
            {location && !showCoordEditor && (
              <LocationPreview
                lat={location.lat}
                lng={location.lng}
                onEdit={() => setShowCoordEditor(true)}
              />
            )}

            {/* Manual coord editor */}
            {showCoordEditor && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="apiary-lat"
                    label={t.apiary.new.latLabel}
                    type="number"
                    step="any"
                    placeholder="44.4949"
                    value={latInput}
                    onChange={(e) => { setLatInput(e.target.value); markDirty() }}
                    inputMode="decimal"
                  />
                  <Input
                    id="apiary-lng"
                    label={t.apiary.new.lngLabel}
                    type="number"
                    step="any"
                    placeholder="11.3426"
                    value={lngInput}
                    onChange={(e) => { setLngInput(e.target.value); markDirty() }}
                    inputMode="decimal"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={handleConfirmCoords}
                >
                  Conferma posizione
                </Button>
              </div>
            )}

            <div className="mt-3">
              <Input
                id="apiary-address"
                label={t.apiary.new.addressLabel}
                placeholder={t.apiary.new.addressPlaceholder}
                value={address}
                onChange={(e) => { setAddress(e.target.value); markDirty() }}
                autoComplete="street-address"
              />
            </div>
          </section>

          {/* Note */}
          <section>
            <label
              htmlFor="apiary-notes"
              className="text-sm font-medium text-wood-700 mb-1.5 block"
            >
              {t.apiary.new.notesLabel}
            </label>
            <textarea
              id="apiary-notes"
              rows={4}
              placeholder={t.apiary.new.notesPlaceholder}
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
          {t.apiary.new.cancel}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="flex-1"
          onClick={doSubmit}
          loading={isPending}
        >
          {t.apiary.new.save}
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
            aria-label={t.apiary.new.unsavedTitle}
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">
                {t.apiary.new.unsavedTitle}
              </h2>
              <p className="text-sm text-wood-500 leading-relaxed">{t.apiary.new.unsavedBody}</p>
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
                {t.apiary.new.unsavedSave}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={onCancel}
                className="w-full"
              >
                {t.apiary.new.unsavedDiscard}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowUnsaved(false)}
                className="w-full"
              >
                {t.apiary.new.unsavedCancel}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
