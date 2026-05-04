interface SectionLabelProps {
  children: React.ReactNode
  required?: boolean
}

export function SectionLabel({ children, required }: SectionLabelProps) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <h3 className="text-sm font-semibold text-wood-700">{children}</h3>
      {required && <span className="text-xs text-wood-400">obbligatorio</span>}
    </div>
  )
}
