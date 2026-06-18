const OR_BASE = 'https://openrouter.ai/api/v1'
const OR_HEADERS = {
  'HTTP-Referer': 'https://apidiario.stefano-passiatore.workers.dev',
  'X-Title': 'Apidiario',
}

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

export interface InspectionResult {
  queen: string
  hasBrood: boolean
  brood: { uova: boolean | null; larve: boolean | null; opercolata: boolean | null }
  population: string
  notes: string
  frames: { covata: number; miele: number; polline: number; vuoti: number }
  hasQueenCells: boolean
  queenCellsRemoved: string[]
  queenCellsRemaining: string[]
  pathologies: string[]
  pollenIncoming: boolean
  varroaCount: string
  varroaMethod: string
  behavior: string
  interventions: string[]
  transcript: string
}

export function isTranscriptValid(transcript: string): boolean {
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

export function basePrompt(): string {
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
  "hasQueenCells": boolean,
  "queenCellsRemoved": ["dry_cup", "egg_cup", "larvae_cup", "closed_cell"],
  "queenCellsRemaining": ["dry_cup", "egg_cup", "larvae_cup", "closed_cell"],
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
- hasQueenCells: true se menzionate celle reali. queenCellsRemoved: celle reali TOLTE/DISTRUTTE (indice febbre sciamatoria). queenCellsRemaining: celle reali LASCIATE (per sostituzione o famiglia orfana). Tipi: ["dry_cup"] (cupolino secco), ["egg_cup"] (cupolino con uovo), ["larvae_cup"] (cupolino con larva), ["closed_cell"] (cella chiusa). "tolte celle reali" → removete, "lasciate celle reali" → remaining.
- pathologies: "varroa" (acaro), "peste_americana", "peste_europea", "covata_calcificata", "nosema", "virus", "altro"
- varroaCount: conta acari come stringa numero es. "5". "" se non misurata.
- varroaMethod: "caduta_naturale", "lavaggio_alcol", "zucchero_velo", "altro"
- behavior: "calmo", "nervoso", "aggressivo"
- interventions: "Tolto telaino", "Aggiunto telaino", "Cambio regina", "Distruzione celle", "Nutrizione"
- pollenIncoming: true se api rientrano con polline
- notes: appunti liberi testuali

REGOLE:
1. Se un valore non è menzionato, usa il valore predefinito
2. Predefiniti: queen="non_cercata", hasBrood=true, population="media", hasQueenCells=false, queenCellsRemoved=[], queenCellsRemaining=[], pollenIncoming=false, frames={0,0,0,0}, behavior="calmo", varroaMethod="caduta_naturale", varroaCount="", notes="", pathologies=[], interventions=[]
3. Pathologies e interventions sono array di stringhe (anche vuoti)
4. varroaCount come stringa numerica o stringa vuota
5. Includi SEMPRE la trascrizione originale nel campo "transcript"
6. Metti contenuti non mappabili in "notes"

Rispondi SOLO con il JSON, senza testo aggiuntivo.`
}

export function validateResult(result: unknown): result is InspectionResult {
  if (!result || typeof result !== 'object') return false
  const r = result as Record<string, unknown>
  if (typeof r['queen'] !== 'string') return false
  if (typeof r['hasBrood'] !== 'boolean') return false
  if (typeof r['population'] !== 'string') return false
  if (typeof r['notes'] !== 'string') return false
  if (typeof r['hasQueenCells'] !== 'boolean') return false
  if (!Array.isArray(r['queenCellsRemoved'])) return false
  if (!Array.isArray(r['queenCellsRemaining'])) return false
  if (typeof r['pollenIncoming'] !== 'boolean') return false
  if (typeof r['varroaCount'] !== 'string') return false
  if (typeof r['varroaMethod'] !== 'string') return false
  if (typeof r['behavior'] !== 'string') return false
  if (typeof r['transcript'] !== 'string') return false
  if (!Array.isArray(r['pathologies'])) return false
  if (!Array.isArray(r['interventions'])) return false
  if (!r['brood'] || typeof r['brood'] !== 'object') return false
  if (!r['frames'] || typeof r['frames'] !== 'object') return false
  return true
}

export interface ExtractionUsage {
  promptTokens: number
  completionTokens: number
  costUsd: number
}

// DeepSeek-Chat pricing on OpenRouter (input $0.14/1M, output $0.28/1M)
const DEEPSEEK_COST_IN_PER_TOKEN = 0.14 / 1_000_000
const DEEPSEEK_COST_OUT_PER_TOKEN = 0.28 / 1_000_000

export async function extractInspection(
  apiKey: string,
  transcript: string,
): Promise<{ result: InspectionResult; usage: ExtractionUsage }> {
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
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Extractor returned empty response')

  const promptTokens = data.usage?.prompt_tokens ?? 0
  const completionTokens = data.usage?.completion_tokens ?? 0
  const costUsd = promptTokens * DEEPSEEK_COST_IN_PER_TOKEN + completionTokens * DEEPSEEK_COST_OUT_PER_TOKEN

  return {
    result: JSON.parse(content) as InspectionResult,
    usage: { promptTokens, completionTokens, costUsd },
  }
}
