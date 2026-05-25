import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuid } from '@/lib/utils'
import { queryClient } from '@/lib/query-client'
import { logActivity } from '@/lib/activity-log'
import type { TablesInsert } from '@/types/database'

export type TreatmentListItem = {
  id: string
  productName: string
  startDate: string
  endDate: string | null
  blocksMelari: boolean
  appliesToAllHives: boolean
  apiaryId: string
  apiaryName: string
  performerName: string
  hiveCount: number
}

export type TreatmentDetail = {
  id: string
  productName: string
  startDate: string
  endDate: string | null
  blocksMelari: boolean
  appliesToAllHives: boolean
  dosageNotes: string | null
  costEur: number | null
  notes: string | null
  apiaryId: string
  apiaryName: string
  performedBy: string
  performerName: string
  hives: { hiveId: string; identifier: string }[]
  createdAt: string
}

export function useTreatments() {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: async (): Promise<TreatmentListItem[]> => {
      const { data, error } = await supabase
        .from('treatments')
        .select('id, product_name, start_date, end_date, blocks_melari, applies_to_all_hives, apiary_id, apiaries!inner(name), treatment_hives(hive_id), performer:performed_by(display_name)')
        .order('start_date', { ascending: false })

      if (error) throw error

      return (data as unknown as {
        id: string
        product_name: string
        start_date: string
        end_date: string | null
        blocks_melari: boolean
        applies_to_all_hives: boolean
        apiary_id: string
        apiaries: { name: string }
        treatment_hives: { hive_id: string }[]
        performer: { display_name: string } | null
      }[]).map((t) => ({
        id: t.id,
        productName: t.product_name,
        startDate: t.start_date,
        endDate: t.end_date,
        blocksMelari: t.blocks_melari,
        appliesToAllHives: t.applies_to_all_hives,
        apiaryId: t.apiary_id,
        apiaryName: t.apiaries.name,
        performerName: t.performer?.display_name ?? '',
        hiveCount: t.applies_to_all_hives ? 0 : (Array.isArray(t.treatment_hives) ? t.treatment_hives.length : 0),
      }))
    },
  })
}

export function useTreatmentsByApiary(apiaryId: string) {
  return useQuery({
    queryKey: ['treatments', 'apiary', apiaryId],
    queryFn: async (): Promise<TreatmentListItem[]> => {
      const { data, error } = await supabase
        .from('treatments')
        .select('id, product_name, start_date, end_date, blocks_melari, applies_to_all_hives, apiary_id, apiaries!inner(name), treatment_hives(hive_id), performer:performed_by(display_name)')
        .eq('apiary_id', apiaryId)
        .order('start_date', { ascending: false })

      if (error) throw error

      return (data as unknown[]).map((t: any) => ({
        id: t.id,
        productName: t.product_name,
        startDate: t.start_date,
        endDate: t.end_date,
        blocksMelari: t.blocks_melari,
        appliesToAllHives: t.applies_to_all_hives,
        apiaryId: t.apiary_id,
        apiaryName: t.apiaries.name,
        performerName: t.performer?.display_name ?? '',
        hiveCount: t.applies_to_all_hives ? 0 : (Array.isArray(t.treatment_hives) ? t.treatment_hives.length : 0),
      }))
    },
    enabled: !!apiaryId,
  })
}

export function useTreatment(id: string) {
  return useQuery({
    queryKey: ['treatment', id],
    queryFn: async (): Promise<TreatmentDetail> => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*, apiaries!inner(name), profiles(display_name), treatment_hives(hive_id, hives!inner(identifier))')
        .eq('id', id)
        .single()

      if (error) throw error

      const t = data as any
      const apiary = t.apiaries as { name: string }
      const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
      const hiveRows = (Array.isArray(t.treatment_hives) ? t.treatment_hives : []) as { hive_id: string; hives: { identifier: string } }[]

      return {
        id: t.id,
        productName: t.product_name,
        startDate: t.start_date,
        endDate: t.end_date,
        blocksMelari: t.blocks_melari,
        appliesToAllHives: t.applies_to_all_hives,
        dosageNotes: t.dosage_notes,
        costEur: t.cost_eur,
        notes: t.notes,
        apiaryId: t.apiary_id,
        apiaryName: apiary.name,
        performedBy: t.performed_by,
        performerName: profile?.display_name ?? '',
        hives: hiveRows.map((h) => ({ hiveId: h.hive_id, identifier: h.hives.identifier })),
        createdAt: t.created_at,
      }
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })
}

type CreateTreatmentInput = {
  apiaryId: string
  productName: string
  blocksMelari: boolean
  appliesToAllHives: boolean
  startDate: string
  endDate: string | null
  dosageNotes: string | null
  costEur: number | null
  notes: string | null
  hiveIds: string[]
  userId: string
}

export function useCreateTreatment() {
  return useMutation<string, Error, CreateTreatmentInput>({
    mutationFn: async (input) => {
      const id = uuid()
      const payload: TablesInsert<'treatments'> = {
        id,
        apiary_id: input.apiaryId,
        product_name: input.productName,
        blocks_melari: input.blocksMelari,
        applies_to_all_hives: input.appliesToAllHives,
        start_date: input.startDate,
        end_date: input.endDate,
        dosage_notes: input.dosageNotes,
        cost_eur: input.costEur,
        notes: input.notes,
        performed_by: input.userId,
      }

      const { error } = await supabase.from('treatments').insert(payload)
      if (error) throw error

      if (!input.appliesToAllHives && input.hiveIds.length > 0) {
        const { error: hiveErr } = await supabase.from('treatment_hives').insert(
          input.hiveIds.map((hiveId) => ({ treatment_id: id, hive_id: hiveId })),
        )
        if (hiveErr) throw hiveErr
      }

      return id
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['treatments'] })
      void logActivity(variables.userId, 'insert', 'treatment', data, `Trattamento "${variables.productName}" creato`)
    },
  })
}

type UpdateTreatmentInput = {
  treatmentId: string
  apiaryId: string
  productName: string
  blocksMelari: boolean
  appliesToAllHives: boolean
  startDate: string
  endDate: string | null
  dosageNotes: string | null
  costEur: number | null
  notes: string | null
  hiveIds: string[]
}

export function useUpdateTreatment() {
  return useMutation<void, Error, UpdateTreatmentInput>({
    mutationFn: async (input) => {
      const { error } = await supabase
        .from('treatments')
        .update({
          apiary_id: input.apiaryId,
          product_name: input.productName,
          blocks_melari: input.blocksMelari,
          applies_to_all_hives: input.appliesToAllHives,
          start_date: input.startDate,
          end_date: input.endDate,
          dosage_notes: input.dosageNotes,
          cost_eur: input.costEur,
          notes: input.notes,
        })
        .eq('id', input.treatmentId)
      if (error) throw error

      // Sync treatment_hives
      await supabase.from('treatment_hives').delete().eq('treatment_id', input.treatmentId)

      if (!input.appliesToAllHives && input.hiveIds.length > 0) {
        const { error: hiveErr } = await supabase.from('treatment_hives').insert(
          input.hiveIds.map((hiveId) => ({ treatment_id: input.treatmentId, hive_id: hiveId })),
        )
        if (hiveErr) throw hiveErr
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['treatments'] })
      void queryClient.invalidateQueries({ queryKey: ['treatment', variables.treatmentId] })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'update', 'treatment', variables.treatmentId, `Trattamento "${variables.productName}" modificato`)
        }
      })
    },
  })
}

export function useDeleteTreatment() {
  return useMutation<string, Error, string>({
    mutationFn: async (id) => {
      const { data: treatment } = await supabase
        .from('treatments')
        .select('product_name')
        .eq('id', id)
        .single()
      const productName = treatment?.product_name ?? ''

      const { error } = await supabase.from('treatments').delete().eq('id', id)
      if (error) throw error

      return productName
    },
    onSuccess: (productName) => {
      void queryClient.invalidateQueries({ queryKey: ['treatments'] })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'delete', 'treatment', null, `Trattamento "${productName}" eliminato`)
        }
      })
    },
  })
}

// Returns active treatment with blocks_melari that involves this hive
export function useActiveMelariBlock(hiveId: string, apiaryId: string) {
  return useQuery({
    queryKey: ['activeMelariBlock', hiveId],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      // Check: treatment_hives for this hive → match active treatments
      const { data: links } = await supabase
        .from('treatment_hives')
        .select('treatment_id')
        .eq('hive_id', hiveId)

      if (links?.length) {
        const ids = links.map((l) => l.treatment_id)
        const { data: treatment } = await supabase
          .from('treatments')
          .select('id, product_name')
          .in('id', ids)
          .eq('blocks_melari', true)
          .lte('start_date', today)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .maybeSingle()
        if (treatment) return { productName: treatment.product_name }
      }

      // Check: applies_to_all_hives for the hive's apiary
      const { data: allHives } = await supabase
        .from('treatments')
        .select('id, product_name')
        .eq('apiary_id', apiaryId)
        .eq('applies_to_all_hives', true)
        .eq('blocks_melari', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .maybeSingle()

      if (allHives) return { productName: allHives.product_name }

      return null
    },
    enabled: !!hiveId && !!apiaryId,
  })
}
