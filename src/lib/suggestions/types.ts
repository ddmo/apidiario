import type { Database } from '@/types/database'

export type Severity = 'critical' | 'warning' | 'info'

export type Category =
  | 'queen'
  | 'brood'
  | 'population'
  | 'stores'
  | 'health'
  | 'swarming'
  | 'equipment'
  | 'harvest'
  | 'schedule'
  | 'season'
  | 'behavior'

export interface Suggestion {
  id: string
  severity: Severity
  category: Category
  title: string
  description: string
  reason: string
  dueByDays?: number
}

export type Hive = Database['public']['Tables']['hives']['Row']
export type Inspection = Database['public']['Tables']['inspections']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']

export interface SuggestionContext {
  hive: Hive
  lastInspection: Inspection | null
  daysSinceLastInspection: number | null
  today: Date
  apiaryLat?: number | null
  recentInspections?: Inspection[]
  reminders?: Reminder[]
}

export type Rule = (ctx: SuggestionContext) => Suggestion | null
