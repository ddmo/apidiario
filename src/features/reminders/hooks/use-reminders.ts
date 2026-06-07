import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Reminder, ReminderListItem, ReminderInsert, ReminderUpdate } from '../types'

const REMINDERS_KEY = 'reminders'

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

function toListItem(data: Record<string, unknown>): ReminderListItem {
  return {
    ...data,
    apiary_name: (data.apiaries as { name: string } | null)?.name ?? null,
    hive_identifier: (data.hives as { identifier: string } | null)?.identifier ?? null,
  } as unknown as ReminderListItem
}

function buildBaseQuery() {
  return supabase
    .from('reminders')
    .select('*, apiaries!left(name), hives!left(identifier)')
}

export function useReminders() {
  return useQuery({
    queryKey: [REMINDERS_KEY, 'active'],
    queryFn: async () => {
      const userId = await getUserId()
      if (!userId) return []

      const { data, error } = await buildBaseQuery()
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('due_at', { ascending: true })

      if (error) throw error
      return (data ?? []).map(toListItem) satisfies ReminderListItem[]
    },
  })
}

export function useCompletedReminders() {
  return useQuery({
    queryKey: [REMINDERS_KEY, 'completed'],
    queryFn: async () => {
      const userId = await getUserId()
      if (!userId) return []

      const { data, error } = await buildBaseQuery()
        .eq('user_id', userId)
        .neq('completed_at', null)
        .order('completed_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data ?? []).map(toListItem) satisfies ReminderListItem[]
    },
  })
}

export function useReminder(id: string | undefined) {
  return useQuery({
    queryKey: [REMINDERS_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await buildBaseQuery()
        .eq('id', id!)
        .single()

      if (error) throw error
      return toListItem(data as Record<string, unknown>) as ReminderListItem
    },
  })
}

export function useCreateReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ReminderInsert) => {
      const { data, error } = await supabase.from('reminders').insert(payload).select().single()
      if (error) throw error
      return data as Reminder
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMINDERS_KEY] })
    },
    onError: (err) => { console.error("[src/features/reminders/hooks/use-reminders.ts] mutation failed", err) },
  })
}

export function useUpdateReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: ReminderUpdate & { id: string }) => {
      const { data, error } = await supabase.from('reminders').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Reminder
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMINDERS_KEY] })
    },
    onError: (err) => { console.error("[src/features/reminders/hooks/use-reminders.ts] mutation failed", err) },
  })
}

export function useCompleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').update({ completed_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMINDERS_KEY] })
    },
    onError: (err) => { console.error("[src/features/reminders/hooks/use-reminders.ts] mutation failed", err) },
  })
}

export function useDeleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('reminders').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Nessun promemoria eliminato. Verifica i permessi.')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMINDERS_KEY] })
    },
    onError: (err) => { console.error("[src/features/reminders/hooks/use-reminders.ts] mutation failed", err) },
  })
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: [REMINDERS_KEY, 'upcoming'],
    queryFn: async () => {
      const userId = await getUserId()
      if (!userId) return []

      const fifteenDaysFromNow = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await buildBaseQuery()
        .eq('user_id', userId)
        .is('completed_at', null)
        .lte('due_at', fifteenDaysFromNow)
        .order('due_at', { ascending: true })
        .limit(10)

      if (error) throw error
      return (data ?? []).map(toListItem) satisfies ReminderListItem[]
    },
  })
}
