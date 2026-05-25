import { Button } from '@/components/ui/button'

interface UnsavedChangesSheetProps {
  open: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesSheet({ open, onSave, onDiscard, onCancel }: UnsavedChangesSheetProps) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-wood-900/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Modifiche non salvate"
        className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg animate-slide-up"
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
        </div>
        <div className="px-5 pt-3 pb-4">
          <h2 className="text-lg font-semibold text-wood-800 mb-1">Modifiche non salvate</h2>
          <p className="text-sm text-wood-500 leading-relaxed">
            Hai compilato parte dell&rsquo;ispezione. Vuoi salvarla prima di uscire?
          </p>
        </div>
        <div className="px-4 flex flex-col gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
          <Button variant="primary" size="lg" onClick={onSave} className="w-full">
            Salva
          </Button>
          <Button variant="secondary" size="lg" onClick={onDiscard} className="w-full">
            Esci senza salvare
          </Button>
          <Button variant="ghost" size="md" onClick={onCancel} className="w-full">
            Annulla
          </Button>
        </div>
      </div>
    </>
  )
}
