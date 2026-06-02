import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type ReminderRow = Tables<'reminders'>
export type ReminderInsert = TablesInsert<'reminders'>
export type ReminderUpdate = TablesUpdate<'reminders'>

export type Reminder = ReminderRow

export type ReminderListItem = Reminder & {
  apiary_name: string | null
  hive_identifier: string | null
}

export type ReminderFormData = {
  title: string
  description: string
  due_at: string
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
  scope: 'global' | 'apiary' | 'hive'
  apiary_id: string
  hive_id: string
}
