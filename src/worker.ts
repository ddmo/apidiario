/// <reference types="@cloudflare/workers-types" />
import type { InspectionResult } from './features/voice-inspection/worker-logic'
import { isTranscriptValid, validateResult, extractInspection } from './features/voice-inspection/worker-logic'

interface VoiceInspectionContext {
  hiveId?: string
}

interface Env {
  OPENAI_API_KEY: string
  OPENROUTER_API_KEY: string
}

async function transcribeAudio(apiKey: string, audio: ArrayBuffer, mimeType: string): Promise<string> {
  const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('webm') ? 'webm' : 'webm'
  const filename = `audio.${ext}`
  const blob = new Blob([audio], { type: mimeType })

  const form = new FormData()
  form.append('file', blob, filename)
  form.append('model', 'whisper-1')
  form.append('language', 'it')
  form.append('response_format', 'verbose_json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Transcription error ${res.status}: ${body}`)
  }

  const data = await res.json() as { text: string; segments?: Array<{ no_speech_prob: number }> }

  // no_speech_prob > 0.8 means Whisper is hallucinating, not transcribing real speech
  const maxNoSpeechProb = Math.max(0, ...(data.segments ?? []).map((s) => s.no_speech_prob))
  if (maxNoSpeechProb > 0.8) {
    throw new Error('Nessun parlato rilevato. Parla chiaramente nel microfono.')
  }

  return data.text
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 })
    }

    if (request.method !== 'POST') {
      return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/api/voice-inspection') {
      return Response.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    try {
      const formData = await request.formData()
      const audioFile = formData.get('audio')
      const contextRaw = formData.get('context')

      if (!audioFile || !(audioFile instanceof File)) {
        return Response.json({ success: false, error: 'Audio file required' }, { status: 400 })
      }

      const context: VoiceInspectionContext = contextRaw
        ? JSON.parse(contextRaw as string)
        : {}

      const audioBuffer = await audioFile.arrayBuffer()
      const mimeType = audioFile.type || 'audio/webm'

      if (audioFile.size < 10240) {
        return Response.json({ success: false, error: 'Audio troppo breve. Parla per almeno qualche secondo.' }, { status: 400 })
      }

      const transcript = (await transcribeAudio(env.OPENAI_API_KEY, audioBuffer, mimeType)).trim()

      if (!transcript || !isTranscriptValid(transcript)) {
        return Response.json({ success: false, error: 'Audio non intelligibile. Riprova parlando chiaramente.' }, { status: 400 })
      }

      const result = await extractInspection(env.OPENROUTER_API_KEY, transcript)

      if (!validateResult(result)) {
        return Response.json({ success: false, error: 'Invalid response from extractor', transcript }, { status: 500 })
      }

      const { transcript: _, ...data } = result

      return Response.json({
        success: true,
        data,
        transcript,
        context,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Voice inspection error:', message)
      return Response.json({ success: false, error: message }, { status: 500 })
    }
  },
}
