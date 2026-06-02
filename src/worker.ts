/// <reference types="@cloudflare/workers-types" />

interface VoiceInspectionContext {
  hiveId?: string
}

interface Env {
  OPENAI_API_KEY: string
  OPENROUTER_API_KEY: string
}

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

interface InspectionResult {
  queen: string
  hasBrood: boolean
  brood: { uova: boolean | null; larve: boolean | null; opercolata: boolean | null }
  population: string
  notes: string
  frames: { covata: number; miele: number; polline: number; vuoti: number }
  queenCells: string
  pathologies: string[]
  pollenIncoming: boolean
  varroaCount: string
  varroaMethod: string
  behavior: string
  interventions: string[]
  transcript: string
}

const OR_BASE = 'https://openrouter.ai/api/v1'
const OR_HEADERS = {
  'HTTP-Referer': 'https://apidiario.stefano-passiatore.workers.dev',
  'X-Title': 'Apidiario',
}

function isTranscriptValid(transcript: string): boolean {
  const t = transcript.trim()
  if (t.length < 20) return false

  // Known Whisper hallucinations on silent/background audio
  const hallucinations = [
    /sottotitoli creati da/i,
    /thank you for watching/i,
    /grazie per la visione/i,
    /al prossimo episodio/i,
    /ringraziamenti/i,
    /created by.*community/i,
    /amara\.org/i,
    /^musica/i,
    /^music/i,
  ]
  return !hallucinations.some((re) => re.test(t))
}

function basePrompt(): string {
  return `Sei un assistente specializzato nell'estrazione di dati da ispezioni apistiche.
Il tuo compito è analizzare la trascrizione di un'ispezione di un'arnia e restituire un JSON strutturato.

CONTESTO: l'utente è un apicoltore che ha dettato ad alta voce le osservazioni durante un'ispezione. La trascrizione è in ITALIANO, spesso con linguaggio colloquiale e termini tecnici apistici.

SCHEMA DEL JSON RICHIESTO:
{
  "queen": "vista" | "non_cercata" | "non_vista",
  "hasBrood": boolean,
  "brood": { "uova": boolean | null, "larve": boolean | null, "opercolata": boolean | null },
  "population": "debole" | "media" | "forte",
  "notes": string,
  "frames": { "covata": number (0-20), "miele": number (0-20), "polline": number (0-20), "vuoti": number (0-20) },
  "queenCells": "nessuna" | "scorta" | "sciamatura" | "sostituzione",
  "pathologies": ["varroa", "peste_americana", "peste_europea", "covata_calcificata", "nosema", "virus", "altro"],
  "pollenIncoming": boolean,
  "varroaCount": string (es. "5", "12", ""),
  "varroaMethod": "caduta_naturale" | "lavaggio_alcol" | "zucchero_velo" | "altro",
  "behavior": "calmo" | "nervoso" | "aggressivo",
  "interventions": ["Tolto telaino", "Aggiunto telaino", "Cambio regina", "Distruzione celle", "Nutrizione"],
  "transcript": string
}

DETTAGLIO CAMPI:
- queen: "vista" (regina vista), "non_vista" (cercata ma non vista), "non_cercata" (non cercata)
- brood: tre stadi indipendenti che possono coesistere. uova = uova fresche, larve = covata aperta/vermetti, opercolata = covata chiusa/stamperella. Se uno stadio non menzionato usa null. Se covata assente, hasBrood=false e tutti null.
- population: "debole" (pochi telaini coperti), "media", "forte" (arnia piena)
- frames: numero telaini 0-20. covata = covata, miele = miele, polline = polline, vuoti = telaini vuoti
- queenCells: "nessuna" (0), "scorta" (celle scorta), "sciamatura" (celle sciamatura), "sostituzione" (celle sostituzione)
- pathologies: "varroa" (acaro), "peste_americana", "peste_europea", "covata_calcificata", "nosema", "virus", "altro"
- varroaCount: conta acari come stringa numero es. "5". "" se non misurata.
- varroaMethod: "caduta_naturale", "lavaggio_alcol", "zucchero_velo", "altro"
- behavior: "calmo", "nervoso", "aggressivo"
- interventions: "Tolto telaino", "Aggiunto telaino", "Cambio regina", "Distruzione celle", "Nutrizione"
- pollenIncoming: true se api rientrano con polline
- notes: appunti liberi testuali

REGOLE:
1. Se un valore non è menzionato, usa il valore predefinito
2. Predefiniti: queen="non_cercata", hasBrood=true, population="media", queenCells="nessuna", pollenIncoming=false, frames={0,0,0,0}, behavior="calmo", varroaMethod="caduta_naturale", varroaCount="", notes="", pathologies=[], interventions=[]
3. Pathologies e interventions sono array di stringhe (anche vuoti)
4. varroaCount come stringa numerica o stringa vuota
5. Includi SEMPRE la trascrizione originale nel campo "transcript"
6. Metti contenuti non mappabili in "notes"

Rispondi SOLO con il JSON, senza testo aggiuntivo.`
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

async function extractInspection(apiKey: string, transcript: string): Promise<InspectionResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: basePrompt() },
    { role: 'user', content: `Trascrizione ispezione:\n${transcript}` },
  ]

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...OR_HEADERS,
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Extraction error ${res.status}: ${body}`)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Extractor returned empty response')

  return JSON.parse(content) as InspectionResult
}

function validateResult(result: unknown): result is InspectionResult {
  if (!result || typeof result !== 'object') return false
  const r = result as Record<string, unknown>
  if (typeof r.queen !== 'string') return false
  if (typeof r.hasBrood !== 'boolean') return false
  if (typeof r.population !== 'string') return false
  if (typeof r.notes !== 'string') return false
  if (typeof r.queenCells !== 'string') return false
  if (typeof r.pollenIncoming !== 'boolean') return false
  if (typeof r.varroaCount !== 'string') return false
  if (typeof r.varroaMethod !== 'string') return false
  if (typeof r.behavior !== 'string') return false
  if (typeof r.transcript !== 'string') return false
  if (!Array.isArray(r.pathologies)) return false
  if (!Array.isArray(r.interventions)) return false
  if (!r.brood || typeof r.brood !== 'object') return false
  if (!r.frames || typeof r.frames !== 'object') return false
  return true
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
