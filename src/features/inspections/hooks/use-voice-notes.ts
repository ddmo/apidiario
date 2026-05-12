import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { VoiceNote } from '../types'

let _idCounter = 0
function nextId(): string {
  _idCounter++
  return `vn_${Date.now()}_${_idCounter}`
}

interface UseVoiceNotesOpts {
  inspectionId: string | null
  initialNotes?: VoiceNote[]
}

export function useVoiceNotes({ inspectionId, initialNotes }: UseVoiceNotesOpts = { inspectionId: null }) {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(initialNotes ?? [])
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const startTime = useRef<number>(0)

  // Fetch existing voice notes for edit flow
  useEffect(() => {
    if (!inspectionId || initialNotes) return
    const id = inspectionId
    let cancelled = false
    async function fetchNotes() {
      const { data } = await supabase
        .from('inspection_voice_notes')
        .select('*')
        .eq('inspection_id', id)
        .order('created_at', { ascending: true })
      if (cancelled || !data) return
      const notes: VoiceNote[] = await Promise.all(
        data.map(async (row) => {
          const { data: signed } = await supabase.storage
            .from('apidiario-media')
            .createSignedUrl(row.storage_path, 3600)
          return {
            id: row.id,
            storagePath: row.storage_path,
            url: signed?.signedUrl,
            durationSeconds: Number(row.duration_seconds),
            pending: false,
          }
        }),
      )
      setVoiceNotes(notes)
    }
    fetchNotes()
    return () => { cancelled = true }
  }, [inspectionId, initialNotes])

  // iOS PWA standalone non supporta getUserMedia
  const canRecord = typeof navigator.mediaDevices?.getUserMedia === 'function'

  const startRecording = useCallback(async () => {
    if (!canRecord) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'].find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorder.current = recorder
      chunks.current = []
      startTime.current = Date.now()

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: recorder.mimeType })
        const durationSeconds = (Date.now() - startTime.current) / 1000
        const id = nextId()
        const url = URL.createObjectURL(blob)
        const note: VoiceNote = { id, blob, url, durationSeconds, pending: true }

        setVoiceNotes((prev) => [...prev, note])

        // If inspection exists, upload immediately
        if (inspectionId) {
          uploadNote(note, inspectionId)
        }
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
    }
  }, [inspectionId])

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }, [])

  const uploadNote = async (note: VoiceNote, inspId: string) => {
    if (!note.blob) return
    const path = `inspections/${inspId}/voice-notes/${note.id}.webm`
    const { error } = await supabase.storage
      .from('apidiario-media')
      .upload(path, note.blob, { contentType: 'audio/webm', upsert: true })
    if (error) {
      console.error('Voice note upload failed', error)
      return
    }
    const { data: signed } = await supabase.storage
      .from('apidiario-media')
      .createSignedUrl(path, 3600)
    const { data: row } = await supabase
      .from('inspection_voice_notes')
      .insert({ inspection_id: inspId, storage_path: path, duration_seconds: note.durationSeconds })
      .select('id')
      .single()
    setVoiceNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? { ...n, id: row?.id ?? note.id, storagePath: path, url: signed?.signedUrl, pending: false, blob: undefined }
          : n,
      ),
    )
  }

  const removeVoiceNote = useCallback(
    (id: string) => {
      const note = voiceNotes.find((n) => n.id === id)
      if (!note) return
      if (note.url) URL.revokeObjectURL(note.url)
      if (note.storagePath) {
        supabase.storage.from('apidiario-media').remove([note.storagePath])
        if (!note.pending) {
          supabase.from('inspection_voice_notes').delete().eq('id', id)
        }
      }
      setVoiceNotes((prev) => prev.filter((n) => n.id !== id))
    },
    [voiceNotes],
  )

  // For new inspections: commit all pending notes after save
  const commit = useCallback(
    async (inspId: string) => {
      const pending = voiceNotes.filter((n) => n.pending && n.blob)
      for (const note of pending) {
        await uploadNote(note, inspId)
      }
    },
    [voiceNotes],
  )

  return { voiceNotes, isRecording, canRecord, startRecording, stopRecording, removeVoiceNote, commit }
}
