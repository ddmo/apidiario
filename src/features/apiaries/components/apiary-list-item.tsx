import { Trees, ChevronRight } from 'lucide-react'
import { t } from '@/i18n/it'
import type { ApiaryListItem as ApiaryListItemData } from '../hooks/use-apiaries'

interface ApiaryListItemProps {
  apiary: ApiaryListItemData
  onClick: () => void
}

export function ApiaryListItem({ apiary, onClick }: ApiaryListItemProps) {
  const { name, hiveCount, photoUrl } = apiary

  const meta =
    hiveCount === 0
      ? t.apiaries.noHives
      : t.apiaries.hiveCount(hiveCount)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-cream-100 border border-cream-200 p-3 flex items-center gap-3 text-left transition-colors duration-150 hover:bg-cream-50 active:bg-cream-200 shadow-xs"
    >
      {/* Thumbnail */}
      <div className="size-16 shrink-0 rounded-md overflow-hidden bg-cream-200 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Trees size={28} strokeWidth={1.75} className="text-wood-400" aria-hidden="true" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-wood-800 truncate">{name}</div>
        <div className="text-sm text-wood-500 truncate mt-0.5">{meta}</div>
      </div>

      <ChevronRight size={20} strokeWidth={1.75} className="text-wood-400 shrink-0" aria-hidden="true" />
    </button>
  )
}
