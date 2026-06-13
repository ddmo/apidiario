import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { InspectionFormState } from '@/features/inspections/types'
import type { VoiceInspectionStatus, VoiceInspectionResponse } from '../types'

const MAX_RECORDING_MS = 60_000

interface UseVoiceInspectionOpts {
  hiveId?: string
}

export function useVoiceInspection({ hiveId }: UseVoiceInspectionOpts = {}) {
  const [status, setStatus] = useState<VoiceInspectionStatus>('idle')
  const [result, setResult] = useState<Partial<InspectionFormState> | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const startTime = useRef<number>(0)
  const maxDurationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTimeoutStop = useRef(false)

  const canRecord = typeof navigator.mediaDevices?.getUserMedia === 'function'

  const startRecording = useCallback(async () => {
    if (!canRecord) {
      setError('Microfono non disponibile. Verifica le autorizzazioni del browser.')
      setStatus('error')
      return
    }
    try {
      setError(null)
      setResult(null)
      setTranscript(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac']
        .find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorder.current = recorder
      chunks.current = []
      startTime.current = Date.now()

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (maxDurationTimer.current) {
          clearTimeout(maxDurationTimer.current)
          maxDurationTimer.current = null
        }
        if (isTimeoutStop.current) {
          isTimeoutStop.current = false
          setError('Registrazione interrotta: limite di 1 minuto raggiunto. Riprova con un dettato più breve.')
          setStatus('error')
          return
        }
        setStatus('processing')
        const blob = new Blob(chunks.current, { type: recorder.mimeType })
        await sendAudio(blob)
      }

      recorder.start()
      setStatus('recording')
      maxDurationTimer.current = setTimeout(() => {
        isTimeoutStop.current = true
        mediaRecorder.current?.stop()
      }, MAX_RECORDING_MS)
    } catch (err) {
      console.error('Failed to start recording', err)
      setError('Impossibile avviare la registrazione. Verifica il microfono.')
      setStatus('error')
    }
  }, [canRecord, hiveId])

  const stopRecording = useCallback(() => {
    if (maxDurationTimer.current) {
      clearTimeout(maxDurationTimer.current)
      maxDurationTimer.current = null
    }
    mediaRecorder.current?.stop()
    if (status === 'recording') {
      // MediaRecorder.onstop will fire
    }
  }, [status])

  const sendAudio = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('context', JSON.stringify({ hiveId }))

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessione scaduta. Effettua di nuovo il login.')
      }

      const res = await fetch('/api/voice-inspection', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        let message: string
        try {
          const json = JSON.parse(body)
          message = json.error || `Errore server (${res.status})`
        } catch {
          message = body || 'Servizio non disponibile. Hai avviato wrangler dev?'
        }
        throw new Error(message)
      }

      const json = await res.json() as VoiceInspectionResponse

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Errore durante la trascrizione')
      }

      // API returns arrays; convert to Sets for InspectionFormState compat
      const ra = json.data as unknown as Record<string, unknown>
      const data: Partial<InspectionFormState> = {
        ...json.data,
        pathologies: new Set(Array.isArray(ra['pathologies']) ? ra['pathologies'] : []),
        interventions: new Set(Array.isArray(ra['interventions']) ? ra['interventions'] : []),
      }

      setResult(data)
      setTranscript(json.transcript ?? null)
      setStatus('success')
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'Errore di connessione. Verifica che wrangler dev sia in esecuzione.'
      setError(message)
      setStatus('error')
    }
  }, [hiveId])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setTranscript(null)
    setError(null)
  }, [])

  return {
    status,
    result,
    transcript,
    error,
    canRecord,
    startRecording,
    stopRecording,
    reset,
  }
}
