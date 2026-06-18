/// <reference types="@cloudflare/workers-types" />
import { isTranscriptValid, validateResult, extractInspection } from './features/voice-inspection/worker-logic'

interface VoiceInspectionContext {
  hiveId?: string
}

interface Env {
  OPENAI_API_KEY: string
  OPENROUTER_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

// Hard cap: Whisper costa per durata; un upload enorme è abuso o errore.
const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10 MB

// Rate-limit best-effort per utente (in-memory per isolate). Non è una
// garanzia forte — gli isolate Cloudflare sono effimeri e multipli — ma
// taglia i loop di abuso da singolo client senza richiedere KV/DO.
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5
const rateHits = new Map<string, number[]>()

function rateLimited(userId: string): boolean {
  const now = Date.now()
  const hits = (rateHits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (hits.length >= RATE_MAX) {
    rateHits.set(userId, hits)
    return true
  }
  hits.push(now)
  rateHits.set(userId, hits)
  return false
}

// Verifica il JWT chiamante contro Supabase Auth. Ritorna { userId, token } o null.
async function verifyUser(env: Env, authHeader: string | null): Promise<{ userId: string; token: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    })
    if (!res.ok) return null
    const user = await res.json() as { id?: string }
    return user.id ? { userId: user.id, token } : null
  } catch {
    return null
  }
}

async function transcribeAudio(
  apiKey: string,
  audio: ArrayBuffer,
  mimeType: string,
): Promise<{ text: string; durationSeconds: number }> {
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

  const data = await res.json() as {
    text: string
    duration?: number
    segments?: Array<{ no_speech_prob: number }>
  }

  // no_speech_prob > 0.8 means Whisper is hallucinating, not transcribing real speech
  const maxNoSpeechProb = Math.max(0, ...(data.segments ?? []).map((s) => s.no_speech_prob))
  if (maxNoSpeechProb > 0.8) {
    throw new Error('Nessun parlato rilevato. Parla chiaramente nel microfono.')
  }

  return { text: data.text, durationSeconds: data.duration ?? 0 }
}

function logUsage(
  env: Env,
  token: string,
  userId: string,
  entries: Array<{
    service: 'whisper' | 'deepseek'
    audio_seconds?: number
    tokens_in?: number
    tokens_out?: number
    cost_usd: number
  }>,
): void {
  const rows = entries.map((e) => ({ ...e, user_id: userId }))
  // fire-and-forget: non blocca la risposta, fallimento silenzioso
  void fetch(`${env.SUPABASE_URL}/rest/v1/api_usage_log`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  }).catch(() => { /* logging failure must not affect the response */ })
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

    // Auth: solo utenti autenticati possono spendere le API key OpenAI/OpenRouter.
    const auth = await verifyUser(env, request.headers.get('Authorization'))
    if (!auth) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { userId, token } = auth

    if (rateLimited(userId)) {
      return Response.json(
        { success: false, error: 'Troppe richieste. Attendi un minuto e riprova.' },
        { status: 429 },
      )
    }

    try {
      // Cap pre-parsing: rifiuta payload enormi prima di bufferizzare.
      const contentLength = Number(request.headers.get('content-length') ?? '0')
      if (contentLength > MAX_AUDIO_BYTES) {
        return Response.json({ success: false, error: 'Audio troppo grande (max 10MB).' }, { status: 413 })
      }

      const formData = await request.formData()
      const audioFile = formData.get('audio')
      const contextRaw = formData.get('context')

      if (!audioFile || !(audioFile instanceof File)) {
        return Response.json({ success: false, error: 'Audio file required' }, { status: 400 })
      }

      if (audioFile.size > MAX_AUDIO_BYTES) {
        return Response.json({ success: false, error: 'Audio troppo grande (max 10MB).' }, { status: 413 })
      }

      const context: VoiceInspectionContext = contextRaw
        ? JSON.parse(contextRaw as string)
        : {}

      const audioBuffer = await audioFile.arrayBuffer()
      const mimeType = audioFile.type || 'audio/webm'

      if (audioFile.size < 10240) {
        return Response.json({ success: false, error: 'Audio troppo breve. Parla per almeno qualche secondo.' }, { status: 400 })
      }

      const { text, durationSeconds } = await transcribeAudio(env.OPENAI_API_KEY, audioBuffer, mimeType)
      const transcript = text.trim()

      if (!transcript || !isTranscriptValid(transcript)) {
        return Response.json({ success: false, error: 'Audio non intelligibile. Riprova parlando chiaramente.' }, { status: 400 })
      }

      // Whisper: $0.006 per minute
      const whisperCostUsd = (durationSeconds / 60) * 0.006

      const { result, usage } = await extractInspection(env.OPENROUTER_API_KEY, transcript)

      if (!validateResult(result)) {
        return Response.json({ success: false, error: 'Invalid response from extractor', transcript }, { status: 500 })
      }

      logUsage(env, token, userId, [
        { service: 'whisper', audio_seconds: durationSeconds, cost_usd: whisperCostUsd },
        { service: 'deepseek', tokens_in: usage.promptTokens, tokens_out: usage.completionTokens, cost_usd: usage.costUsd },
      ])

      const data = { ...result } as Partial<typeof result>
      delete data.transcript

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
