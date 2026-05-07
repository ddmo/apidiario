import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InspectionNoteFieldProps {
  value: string
  expanded: boolean
  onExpand: () => void
  onChange: (value: string) => void
  dirty?: boolean
}

export function InspectionNoteField({ value, expanded, onExpand, onChange, dirty = true }: InspectionNoteFieldProps) {
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="w-full h-12 bg-cream-50 border border-cream-200 rounded-md px-4 flex items-center justify-between text-left transition-colors hover:border-wood-400/40"
      >
        <span
          className={cn(
            'text-sm',
            value && dirty && 'text-wood-700',
            value && !dirty && 'text-wood-500',
            !value && 'text-wood-400',
          )}
        >
          {value || 'Aggiungi nota o detta…'}
        </span>
        <Mic size={20} className="text-wood-400 shrink-0" />
      </button>
    )
  }

  return (
    <div className="bg-cream-50 border border-cream-200 rounded-md focus-within:border-honey-500 focus-within:ring-2 focus-within:ring-honey-500/20 transition-shadow">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        rows={4}
        placeholder="Aggiungi nota o detta…"
        className="w-full bg-transparent px-4 py-3 text-base text-wood-700 placeholder:text-wood-400 focus:outline-none resize-none"
      />
      <div className="flex items-center justify-between border-t border-cream-200 px-2 py-1.5">
        <button
          type="button"
          aria-label="Inserisci nota vocale"
          className="size-9 flex items-center justify-center text-wood-500 hover:text-wood-700 rounded transition-colors"
        >
          <Mic size={18} />
        </button>
        <span className="text-xs text-wood-400 pr-2">{value.length} caratteri</span>
      </div>
    </div>
  )
}
