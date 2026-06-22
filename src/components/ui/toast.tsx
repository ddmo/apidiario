import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToastContext } from '@/contexts/toast-context'

export type ToastVariant = 'success' | 'error'

interface ToastState {
  id: string
  message: string
  variant: ToastVariant
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast({ id: Math.random().toString(36).slice(2, 10), message, variant })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <ToastItem key={toast.id} {...toast} onDismiss={() => setToast(null)} />
      )}
    </ToastContext.Provider>
  )
}

const DURATION: Record<ToastVariant, number> = {
  success: 3000,
  error: 5000,
}

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-success-100 border-success-500/40 text-wood-700',
  error: 'bg-danger-100 border-danger-500/40 text-wood-700',
}

const ICON_STYLES: Record<ToastVariant, string> = {
  success: 'text-success-500',
  error: 'text-danger-500',
}

interface ToastItemProps extends ToastState {
  onDismiss: () => void
}

function ToastItem({ message, variant, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, DURATION[variant])
    return () => clearTimeout(t)
  }, [variant, onDismiss])

  const Icon = variant === 'success' ? CheckCircle : AlertCircle

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed inset-x-4 z-[60] flex items-center gap-3 px-4 py-3',
        'rounded-lg border shadow-sm',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        STYLES[variant],
      )}
      style={{ bottom: 'calc(var(--bottom-nav-h, 0px) + 16px + env(safe-area-inset-bottom))' }}
    >
      <Icon size={18} className={cn('shrink-0', ICON_STYLES[variant])} aria-hidden="true" />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Chiudi notifica"
        className="text-wood-400 hover:text-wood-600 transition-colors shrink-0 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
