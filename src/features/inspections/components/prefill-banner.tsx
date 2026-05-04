interface PrefillBannerProps {
  kind: 'first' | 'prefilled'
  lastDate?: string
  onReset?: () => void
}

export function PrefillBanner({ kind, lastDate, onReset }: PrefillBannerProps) {
  if (kind === 'first') {
    return (
      <div className="bg-cream-100 border-b border-cream-200 px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-wood-500">Nuovo</span>
        <span className="text-sm text-wood-500">Prima ispezione di questa arnia</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onReset}
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
