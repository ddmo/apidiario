import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'error' }

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })
  const { showToast } = useToast()

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      showToast(t.apiary.new.locationUnavailable, 'error')
      setState({ status: 'error' })
      return
    }

    setState({ status: 'loading' })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'success',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (err) => {
        // err.code 1 = PERMISSION_DENIED, 2 = UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) {
          showToast(t.apiary.new.locationDenied, 'error')
          setState({ status: 'denied' })
        } else {
          showToast(t.apiary.new.locationUnavailable, 'error')
          setState({ status: 'error' })
        }
      },
      { timeout: 10_000, maximumAge: 30_000 },
    )
  }, [showToast])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, request, reset }
}
