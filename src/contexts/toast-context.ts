import { createContext } from 'react'
import type { ToastVariant } from '@/components/ui/toast'

export interface ToastContextValue {
  showToast: (message: string, variant: ToastVariant) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
