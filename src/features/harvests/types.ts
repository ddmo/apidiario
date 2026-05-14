import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type HarvestRow = Tables<'harvests'>
export type HarvestInsert = TablesInsert<'harvests'>
export type HarvestUpdate = TablesUpdate<'harvests'>

export type HarvestListItem = Pick<
  HarvestRow,
  'id' | 'apiary_id' | 'harvested_on' | 'honey_type' | 'total_kg' | 'humidity_pct' | 'batch_code' | 'notes'
> & {
  apiary_name?: string | null
}

export type HarvestFormState = {
  apiaryId: string
  harvestedOn: string
  honeyType: string
  totalKg: string
  humidityPct: string
  batchCode: string
  notes: string
}

export const DEFAULT_HARVEST_STATE: HarvestFormState = {
  apiaryId: '',
  harvestedOn: new Date().toISOString().slice(0, 10),
  honeyType: '',
  totalKg: '',
  humidityPct: '',
  batchCode: '',
  notes: '',
}
