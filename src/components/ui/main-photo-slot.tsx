import { Camera, X } from 'lucide-react'

interface MainPhotoSlotProps {
  previewUrl?: string | null
  onPick: () => void
  onChange: () => void
  onRemove: () => void
  aspect?: string
}

export function MainPhotoSlot({
  previewUrl,
  onPick,
  onChange,
  onRemove,
  aspect = '16/9',
}: MainPhotoSlotProps) {
  if (!previewUrl) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="w-full bg-cream-100 border border-dashed border-cream-200 hover:border-wood-400/50 rounded-md flex flex-col items-center justify-center gap-2 transition-colors text-wood-400 hover:text-wood-500"
        style={{ aspectRatio: aspect }}
      >
        <Camera size={32} strokeWidth={1.75} aria-hidden="true" />
        <span className="text-sm font-medium">Aggiungi foto</span>
        <span className="text-xs text-wood-400">JPG, PNG · max 10 MB</span>
      </button>
    )
  }

  return (
    <div className="relative w-full rounded-md overflow-hidden" style={{ aspectRatio: aspect }}>
      <img src={previewUrl} alt="Foto di riferimento apiario" className="w-full h-full object-cover" />

      <button
        type="button"
        aria-label="Rimuovi foto"
        onClick={onRemove}
        className="absolute top-2 left-2 size-8 rounded-full bg-cream-50/90 backdrop-blur-sm text-wood-700 hover:text-danger-500 flex items-center justify-center transition-colors"
      >
        <X size={16} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        aria-label="Cambia foto"
        onClick={onChange}
        className="absolute top-2 right-2 h-8 px-3 rounded-full bg-cream-50/90 backdrop-blur-sm text-wood-700 hover:text-wood-800 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      >
        <Camera size={14} strokeWidth={1.75} aria-hidden="true" />
        Cambia
      </button>
    </div>
  )
}
