import type { PathologyType, VarroaMethod } from './types'

export const PATHOLOGY_LABELS: Record<PathologyType, string> = {
  varroa: 'Varroa',
  peste_americana: 'Peste americana',
  peste_europea: 'Peste europea',
  covata_calcificata: 'Covata calcificata',
  nosema: 'Nosema',
  virus: 'Virus',
  altro: 'Altro',
}

export const PATHOLOGY_OPTIONS = Object.entries(PATHOLOGY_LABELS) as [PathologyType, string][]

export const VARROA_METHOD_LABELS: Record<VarroaMethod, string> = {
  caduta_naturale: 'Caduta',
  lavaggio_alcol: 'Alcol',
  zucchero_velo: 'Zucchero',
  altro: 'Altro',
}

export const VARROA_METHOD_OPTIONS = Object.entries(VARROA_METHOD_LABELS) as [VarroaMethod, string][]

export const INTERVENTION_OPTIONS = [
  'Tolto telaino',
  'Aggiunto telaino',
  'Cambio regina',
  'Nutrizione',
]

export const PENDING_INTERVENTION_OPTIONS = [
  'Aggiungere/Sostituire melario',
]
