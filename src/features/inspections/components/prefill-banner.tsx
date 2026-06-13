import { useState } from 'react'

interface PrefillBannerProps {
  kind: 'first' | 'prefilled'
  lastDate?: string
  onReset?: () => void
}

export function PrefillBanner({ kind, lastDate, onReset }: PrefillBannerProps) {
  const [confirming, setConfirming] = useState(false)

  if (kind === 'first') {
    return (
      <div className="bg-cream-100 border-b border-cream-200 px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-wood-500">Nuovo</span>
        <span className="text-sm text-wood-500">Prima ispezione di questa arnia</span>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="bg-cream-100 border-b border-cream-200 px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm text-wood-600">Azzera i dati precompilati?</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setConfirming(false); onReset?.() }}
            className="text-xs font-semibold text-danger-500 hover:text-danger-600 transition-colors"
          >
            Sì, azzera
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs font-medium text-wood-400 hover:text-wood-600 transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="w-full bg-cream-100 border-b border-cream-200 px-4 py-2.5 flex items-center justify-between text-left hover:bg-cream-200 transition-colors"
    >
      <span className="text-sm text-wood-500">
        Precompilato dall&rsquo;ispezione del{' '}
        <span className="font-medium text-wood-700">{lastDate}</span>
      </span>
      <span className="text-xs font-medium text-honey-600">Azzera</span>
    </button>
  )
}
