import { Button } from '@/components/ui/button'

interface FormSubmitBarProps {
  onCancel: () => void
  onSave: () => void
  saveLabel?: string
  isSaving?: boolean
  saveDisabled?: boolean
}

export function FormSubmitBar({ onCancel, onSave, saveLabel = 'Salva ispezione', isSaving = false, saveDisabled = false }: FormSubmitBarProps) {
  return (
    <div className="sticky bottom-0 bg-cream-50/95 backdrop-blur-sm border-t border-cream-200 px-4 py-3 flex items-center gap-2 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
      <Button type="button" variant="ghost" size="md" onClick={onCancel} className="shrink-0 px-4">
        Annulla
      </Button>
      <Button type="button" variant="primary" size="md" onClick={onSave} loading={isSaving} disabled={saveDisabled} className="flex-1">
        {isSaving ? 'Salvataggio…' : saveLabel}
      </Button>
    </div>
  )
}
