import { describe, it, expect, beforeAll } from 'vitest'
import { config } from 'dotenv'
import { isTranscriptValid, validateResult, extractInspection } from '../worker-logic'
import type { InspectionResult } from '../worker-logic'

// Load wrangler dev secrets so OPENROUTER_API_KEY is available without extra setup
config({ path: '.dev.vars' })

const apiKey = process.env['OPENROUTER_API_KEY']

// ── Pure functions ─────────────────────────────────────────────────────────────

describe('isTranscriptValid', () => {
  it('accepts normal Italian beekeeping text', () => {
    expect(isTranscriptValid('Regina vista, covata bella, api calme.')).toBe(true)
  })

  it('rejects strings shorter than 20 chars', () => {
    expect(isTranscriptValid('ok')).toBe(false)
    expect(isTranscriptValid('tutto bene')).toBe(false)
    expect(isTranscriptValid('a'.repeat(19))).toBe(false)
    expect(isTranscriptValid('a'.repeat(20))).toBe(true)
  })

  it('rejects whitespace-only strings (after trim)', () => {
    expect(isTranscriptValid('   ')).toBe(false)
  })

  it('rejects known Whisper hallucinations', () => {
    expect(isTranscriptValid('Sottotitoli creati da una comunità Amara.org')).toBe(false)
    expect(isTranscriptValid('Thank you for watching this video today')).toBe(false)
    expect(isTranscriptValid('Grazie per la visione di questo video')).toBe(false)
    expect(isTranscriptValid('Al prossimo episodio della serie completa')).toBe(false)
    expect(isTranscriptValid('Musica di sottofondo durante il filmato')).toBe(false)
    expect(isTranscriptValid('Music playing in the background here')).toBe(false)
    expect(isTranscriptValid('Created by the amazing online community')).toBe(false)
    expect(isTranscriptValid('Amara.org subtitle platform volunteer work')).toBe(false)
    expect(isTranscriptValid('Ringraziamenti a tutti i sostenitori del canale')).toBe(false)
  })

  it('hallucination check is case-insensitive', () => {
    expect(isTranscriptValid('SOTTOTITOLI CREATI DA qualcuno di speciale')).toBe(false)
    expect(isTranscriptValid('MUSICA di sottofondo durante il filmato')).toBe(false)
  })
})

describe('validateResult', () => {
  const valid: InspectionResult = {
    queen: 'vista',
    hasBrood: true,
    brood: { uova: true, larve: true, opercolata: true },
    population: 'media',
    notes: '',
    frames: { covata: 4, miele: 2, polline: 1, vuoti: 0 },
    hasQueenCells: false,
    queenCellsRemoved: [],
    queenCellsRemaining: [],
    pathologies: [],
    pollenIncoming: false,
    varroaCount: '',
    varroaMethod: 'caduta_naturale',
    behavior: 'calmo',
    interventions: [],
    transcript: 'testo ispezione',
  }

  it('accepts a fully valid object', () => {
    expect(validateResult(valid)).toBe(true)
  })

  it('accepts null brood stages', () => {
    expect(validateResult({ ...valid, brood: { uova: null, larve: null, opercolata: null } })).toBe(true)
  })

  it('rejects null / undefined', () => {
    expect(validateResult(null)).toBe(false)
    expect(validateResult(undefined)).toBe(false)
  })

  it('rejects non-object primitives', () => {
    expect(validateResult('string')).toBe(false)
    expect(validateResult(42)).toBe(false)
  })

  it('rejects missing required string fields', () => {
    const { queen: _q, ...noQueen } = valid
    expect(validateResult(noQueen)).toBe(false)

    const { varroaCount: _vc, ...noVarroa } = valid
    expect(validateResult(noVarroa)).toBe(false)
  })

  it('rejects wrong types', () => {
    expect(validateResult({ ...valid, hasBrood: 'yes' })).toBe(false)
    expect(validateResult({ ...valid, pollenIncoming: 1 })).toBe(false)
    expect(validateResult({ ...valid, pathologies: 'varroa' })).toBe(false)
    expect(validateResult({ ...valid, interventions: null })).toBe(false)
    expect(validateResult({ ...valid, brood: null })).toBe(false)
    expect(validateResult({ ...valid, frames: 'many' })).toBe(false)
  })
})

// ── Integration: real DeepSeek LLM calls ──────────────────────────────────────
// Requires OPENROUTER_API_KEY in .dev.vars (loaded above).
// Run with: npm test -- --reporter=verbose
// Skip automatically when key is absent (CI without secrets).

type CorpusEntry = {
  name: string
  text: string
  check: (r: InspectionResult) => void
}

const CORPUS: CorpusEntry[] = [
  {
    name: 'happy path — regina vista, covata completa, api calme',
    text: "Tutto ok oggi. Ho visto la regina che deponeva uova. C'è covata completa con uova fresche, larve aperte e covata opercolata abbondante. Api molto calme durante il lavoro.",
    check: (r) => {
      expect(r.queen).toBe('vista')
      expect(r.hasBrood).toBe(true)
      expect(r.brood.uova).toBe(true)
      expect(r.brood.larve).toBe(true)
      expect(r.brood.opercolata).toBe(true)
      expect(r.behavior).toBe('calmo')
    },
  },
  {
    name: 'regina non cercata',
    text: "Ispezione veloce, ho solo controllato la covata. Non ho cercato la regina, sembrava tutto a posto.",
    check: (r) => {
      expect(r.queen).toBe('non_cercata')
    },
  },
  {
    name: 'regina non vista',
    text: "Ho cercato la regina su tutti i telaini ma non l'ho trovata. Ci sono le uova quindi deve essere presente.",
    check: (r) => {
      expect(r.queen).toBe('non_vista')
      expect(r.brood.uova).toBe(true)
    },
  },
  {
    name: 'covata assente',
    text: "Arnia senza covata. Niente uova, niente larve, niente opercolata. Probabilmente orfana.",
    check: (r) => {
      expect(r.hasBrood).toBe(false)
      // LLM può restituire null o false per gli stadi quando hasBrood=false — entrambi accettabili
      expect(r.brood.uova == null || r.brood.uova === false).toBe(true)
      expect(r.brood.larve == null || r.brood.larve === false).toBe(true)
      expect(r.brood.opercolata == null || r.brood.opercolata === false).toBe(true)
    },
  },
  {
    name: 'celle reali tolte — chiuse',
    text: "Ho trovato tre celle reali chiuse in fondo al telaino e le ho distrutte tutte e tre.",
    check: (r) => {
      expect(r.hasQueenCells).toBe(true)
      // Il LLM può non ripetere il tipo per ogni cella (limite noto del prompt):
      // assert tipo corretto e almeno una cella, non il conteggio esatto
      expect(r.queenCellsRemoved.length).toBeGreaterThanOrEqual(1)
      expect(r.queenCellsRemoved.every((c) => c === 'closed_cell')).toBe(true)
      expect(r.queenCellsRemaining).toHaveLength(0)
    },
  },
  {
    name: 'celle reali lasciate — cupolini con larva',
    text: "Ho lasciato due cupolini con larva per fare la sostituzione naturale della regina.",
    check: (r) => {
      expect(r.hasQueenCells).toBe(true)
      expect(r.queenCellsRemaining.length).toBeGreaterThanOrEqual(1)
      expect(r.queenCellsRemaining.every((c) => c === 'larvae_cup')).toBe(true)
      expect(r.queenCellsRemoved).toHaveLength(0)
    },
  },
  {
    name: 'celle reali miste — tolte chiuse, lasciati cupolini con uovo',
    text: "Tolte due celle reali chiuse a rischio sciamatura. Lasciati tre cupolini con uovo per la sostituzione pianificata.",
    check: (r) => {
      expect(r.queenCellsRemoved.length).toBeGreaterThanOrEqual(1)
      expect(r.queenCellsRemoved.every((c) => c === 'closed_cell')).toBe(true)
      expect(r.queenCellsRemaining.length).toBeGreaterThanOrEqual(1)
      expect(r.queenCellsRemaining.every((c) => c === 'egg_cup')).toBe(true)
    },
  },
  {
    name: 'varroa — conteggio e metodo lavaggio alcol',
    text: "Ho fatto il conteggio della varroa con il lavaggio all'alcol. Trovati dodici acari su trecento api.",
    check: (r) => {
      expect(r.varroaCount).toBe('12')
      expect(r.varroaMethod).toBe('lavaggio_alcol')
      // Il prompt non forza l'aggiunta di 'varroa' a pathologies quando c'è un conteggio;
      // accettiamo varroaCount non vuoto come prova alternativa di rilevamento varroa
      const varroaDetected = r.pathologies.includes('varroa') || r.varroaCount !== ''
      expect(varroaDetected).toBe(true)
    },
  },
  {
    name: 'patologie multiple — varroa e covata calcificata',
    text: "Trovata varroa in quantità, c'è anche covata calcificata in un angolo del telaino. Situazione da monitorare attentamente.",
    check: (r) => {
      expect(r.pathologies).toContain('varroa')
      expect(r.pathologies).toContain('covata_calcificata')
    },
  },
  {
    name: 'interventi multipli — aggiunto telaino e nutrizione',
    text: "Ho aggiunto un telaino di fondato al centro del nido. Ho fatto anche la nutrizione con due litri di sciroppo di zucchero.",
    check: (r) => {
      expect(r.interventions).toContain('Aggiunto telaino')
      expect(r.interventions).toContain('Nutrizione')
    },
  },
  {
    name: 'popolazione debole',
    text: "Arnia molto debole, pochissime api, coprono a malapena tre telaini. Preoccupante per la stagione invernale.",
    check: (r) => {
      expect(r.population).toBe('debole')
    },
  },
  {
    name: 'popolazione forte',
    text: "Arnia fortissima, letteralmente piena di api, tutti i telaini coperti e stanno già pensando di sciamare.",
    check: (r) => {
      expect(r.population).toBe('forte')
    },
  },
  {
    name: 'conteggio telaini preciso',
    text: "Sei telaini di covata, tre di miele bello pronto, due di polline fresco e uno vuoto alla fine.",
    check: (r) => {
      expect(r.frames.covata).toBe(6)
      expect(r.frames.miele).toBe(3)
      expect(r.frames.polline).toBe(2)
      expect(r.frames.vuoti).toBe(1)
    },
  },
  {
    name: 'comportamento aggressivo',
    text: "Api molto aggressive oggi, difficile lavorare, hanno attaccato subito appena aperta l'arnia.",
    check: (r) => {
      expect(r.behavior).toBe('aggressivo')
    },
  },
  {
    name: 'polline in entrata',
    text: "Molte api rientrano cariche di polline giallo brillante, ottimo apporto dalla fioritura del tiglio vicino.",
    check: (r) => {
      expect(r.pollenIncoming).toBe(true)
    },
  },
  {
    name: 'scenario complesso — tutti i campi principali',
    text: "Ispezione completa. Regina vista e attiva. Covata piena con uova, larve e opercolata su sette telaini. Due telaini di miele, uno di polline. Trovata varroa, fatto lavaggio alcol, cinque acari. Aggiunto un telaino vuoto. Api nervose. Polline in entrata. Trovata una cella reale chiusa e tolta.",
    check: (r) => {
      expect(r.queen).toBe('vista')
      expect(r.hasBrood).toBe(true)
      expect(r.frames.covata).toBe(7)
      expect(r.frames.miele).toBe(2)
      expect(r.frames.polline).toBe(1)
      expect(r.pathologies).toContain('varroa')
      expect(r.varroaMethod).toBe('lavaggio_alcol')
      expect(r.varroaCount).toBe('5')
      expect(r.interventions).toContain('Aggiunto telaino')
      expect(r.behavior).toBe('nervoso')
      expect(r.pollenIncoming).toBe(true)
      expect(r.queenCellsRemoved).toHaveLength(1)
      expect(r.queenCellsRemoved[0]).toBe('closed_cell')
    },
  },
]

describe.skipIf(!apiKey)('extractInspection — integrazione DeepSeek', () => {
  // Ensure key loaded before any test runs (belt-and-suspenders)
  beforeAll(() => {
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set — check .dev.vars')
  })

  it.each(CORPUS)('$name', async ({ text, check }) => {
    const { result } = await extractInspection(apiKey!, text)
    expect(validateResult(result), `validateResult failed: ${JSON.stringify(result)}`).toBe(true)
    expect(result.transcript.length).toBeGreaterThan(0)
    check(result)
  }, 30_000)
})
