import { Compass, Pencil } from 'lucide-react'

interface LocationPreviewProps {
  lat: number
  lng: number
  onEdit?: () => void
}

function formatCoord(n: number, pos: string, neg: string) {
  const v = Math.abs(n)
  const d = Math.floor(v)
  const m = ((v - d) * 60).toFixed(2)
  const h = n >= 0 ? pos : neg
  return `${d}° ${m}' ${h}`
}

export function LocationPreview({ lat, lng, onEdit }: LocationPreviewProps) {
  return (
    <div
      className="relative w-full bg-cream-100 border border-cream-200 rounded-md overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Schematic grid — no real map */}
      <svg
        viewBox="0 0 160 90"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <pattern id="lp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#C9B896" strokeWidth="0.4" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="160" height="90" fill="url(#lp-grid)" />
        <path
          d="M0 70 Q 40 55 80 60 T 160 50"
          fill="none"
          stroke="#A6916C"
          strokeWidth="0.8"
          opacity="0.5"
          strokeDasharray="2 2"
        />
        <path
          d="M30 0 Q 35 30 60 45 Q 90 60 70 90"
          fill="none"
          stroke="#7A6444"
          strokeWidth="0.6"
          opacity="0.3"
        />
      </svg>

      {/* Pin halo */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full"
        style={{ background: 'rgba(199, 137, 26, 0.18)' }}
        aria-hidden="true"
      />

      {/* Pin icon */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-honey-500"
        style={{ marginTop: -4 }}
        aria-hidden="true"
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>

      {/* Coordinates pill */}
      <div
        className="absolute left-2 bottom-2 flex items-center gap-1.5 bg-cream-50/90 backdrop-blur-sm rounded px-2 py-1 text-[11px] font-medium text-wood-700"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        <Compass size={12} strokeWidth={1.75} aria-hidden="true" />
        <span>
          {formatCoord(lat, 'N', 'S')} · {formatCoord(lng, 'E', 'W')}
        </span>
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute right-2 bottom-2 h-7 px-2.5 inline-flex items-center gap-1 bg-cream-50/90 backdrop-blur-sm rounded text-xs font-medium text-wood-700 hover:bg-cream-50 transition-colors"
        >
          <Pencil size={12} strokeWidth={1.75} aria-hidden="true" />
          <span>Modifica</span>
        </button>
      )}
    </div>
  )
}
