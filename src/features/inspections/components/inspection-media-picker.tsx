import { Camera, Loader2, X, Play } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  media_type: string
  signedUrl?: string
}

interface InspectionMediaPickerProps {
  media: MediaItem[]
  uploading: boolean
  onPickFiles: () => void
  onRemove: (id: string) => void
}

export function InspectionMediaPicker({ media, uploading, onPickFiles, onRemove }: InspectionMediaPickerProps) {
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {/* Existing media */}
        {media.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-md overflow-hidden bg-wood-100">
            {item.media_type === 'image' ? (
              <img
                src={item.signedUrl}
                alt=""
                className="size-full object-cover cursor-pointer"
                onClick={() => setPreview(item.signedUrl ?? null)}
              />
            ) : (
              <div
                className="size-full flex items-center justify-center cursor-pointer bg-wood-800/10"
                onClick={() => setPreview(item.signedUrl ?? null)}
              >
                {item.signedUrl ? (
                  <video src={item.signedUrl} className="size-full object-cover" />
                ) : (
                  <Play size={24} className="text-wood-400" />
                )}
                <Play size={20} className="absolute text-white drop-shadow-md" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute top-1 right-1 size-6 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="Rimuovi"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Uploading placeholder */}
        {uploading && (
          <div className="aspect-square rounded-md border border-dashed border-cream-200 bg-cream-50 flex items-center justify-center">
            <Loader2 size={22} className="text-wood-400 animate-spin" />
          </div>
        )}

        {/* Add button */}
        <button
          type="button"
          onClick={onPickFiles}
          disabled={uploading}
          className={cn(
            'aspect-square rounded-md border border-dashed border-cream-200 bg-cream-50 flex flex-col items-center justify-center gap-1 transition-colors',
            'hover:bg-cream-100 disabled:opacity-40',
          )}
        >
          <Camera size={22} className="text-wood-500" />
          <span className="text-xs font-medium text-wood-500">Aggiungi</span>
        </button>
      </div>

      {/* Fullscreen preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-white/20 text-white"
            aria-label="Chiudi"
          >
            <X size={24} />
          </button>
          {preview.match(/\.(mp4|mov|webm|m4v)$/i) || media.find((m) => m.signedUrl === preview)?.media_type === 'video' ? (
            <video src={preview} controls autoPlay className="max-h-full max-w-full rounded-lg" />
          ) : (
            <img src={preview} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
          )}
        </div>
      )}
    </>
  )
}
