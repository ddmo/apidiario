import type { Rule } from '../types'

export const pathologyFollowup: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (!insp.pathologies || insp.pathologies.length === 0) return null
  const names = insp.pathologies.map((p) => {
    const map: Record<string, string> = {
      varroa: 'varroa',
      peste_americana: 'peste americana',
      peste_europea: 'peste europea',
      covata_calcificata: 'covata calcificata',
      nosema: 'nosema',
      virus: 'virus',
      altro: 'altro',
    }
    return map[p] ?? p
  })
  return {
    id: 'pathology-followup',
    severity: 'warning',
    category: 'health',
    title: `Patologia${names.length > 1 ? 'e' : ''} da monitorare`,
    description: `Controllo evoluzione: ${names.join(', ')}. Verifica se la situazione è migliorata o peggiorata.`,
    reason: `pathologies non vuoto: ${insp.pathologies.join(', ')}`,
    dueByDays: 7,
  }
}

const VARROA_THRESHOLDS: Record<string, number> = {
  caduta_naturale: 3,
  lavaggio_alcol: 2,
  zucchero_velo: 3,
  altro: 3,
}

export const varroaTreatmentWindow: Rule = (ctx) => {
  const insp = ctx.lastInspection
  if (!insp) return null
  if (insp.varroa_count == null) return null
  const threshold = VARROA_THRESHOLDS[insp.varroa_count_method ?? 'caduta_naturale'] ?? 3
  if (insp.varroa_count <= threshold) return null
  return {
    id: 'varroa-treatment-window',
    severity: 'warning',
    category: 'health',
    title: 'Soglia varroa superata',
    description: `Conteggio varroa: ${insp.varroa_count} (metodo: ${insp.varroa_count_method ?? 'caduta_naturale'}). Superata soglia di ${threshold}. Pianifica trattamento antivarroa.`,
    reason: `varroa_count = ${insp.varroa_count} > soglia ${threshold} per metodo ${insp.varroa_count_method}`,
    dueByDays: 14,
  }
}

export const varroaCountMissingInSeason: Rule = (ctx) => {
  // Check if no varroa count in last 60 days AND current month is July-Sept
  const m = ctx.today.getMonth() // 0-based
  if (m < 6 || m > 8) return null // not July-Sept
  const insp = ctx.lastInspection
  if (insp?.varroa_count != null) return null // has a count
  // Check if ANY recent inspection has a varroa count
  const recent = ctx.recentInspections ?? []
  const hasRecentCount = recent.some((i) => i.varroa_count != null)
  if (hasRecentCount) return null
  return {
    id: 'varroa-count-missing-in-season',
    severity: 'warning',
    category: 'health',
    title: 'Conteggio varroa raccomandato',
    description: 'Periodo estivo: nessun conteggio varroa registrato di recente. Effettua un conteggio per valutare la necessità di trattamento.',
    reason: 'nessun varroa_count negli ultimi 60 giorni AND mese tra luglio e settembre',
    dueByDays: 14,
  }
}
