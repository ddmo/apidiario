import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { logActivity } from '@/lib/activity-log'
import type { Database } from '@/types/database'

export type HiveListItem = {
  id: string
  identifier: string
  apiaryId: string
  apiaryName?: string
  hiveType: Database['public']['Enums']['hive_type']
  beeRace: Database['public']['Enums']['bee_race']
  nidoFrameCount: number
  melariCount: number
  status: Database['public']['Enums']['hive_status']
  hasApiscampo: boolean
  hasPropolisNet: boolean
  hasPollenTrap: boolean
  hasActiveQueen: boolean | 'non_cercata'
  lastInspection: { performedAt: string; broodFrameCount: number; honeyFrameCount: number; pollenFrameCount: number; queenSeen: string | null } | null
}

export function useHivesByApiary(apiaryId: string) {
  return useQuery({
    queryKey: ['hives', apiaryId],
    queryFn: async (): Promise<HiveListItem[]> => {
      const { data: hivesData, error: hivesError } = await supabase
        .from('hives')
        .select(
          'id, identifier, apiary_id, hive_type, bee_race, nido_frame_count, melari_count, status, has_apiscampo, has_propolis_net, has_pollen_trap',
        )
        .eq('apiary_id', apiaryId)
        .is('archived_at', null)
        .order('created_at', { ascending: true })

      if (hivesError) throw hivesError
      if (!hivesData.length) return []

      const hiveIds = hivesData.map((h) => h.id)

      const [{ data: inspData }, { data: queensData }] = await Promise.all([
        supabase
          .from('inspections')
          .select('hive_id, performed_at, brood_frame_count, honey_frame_count, pollen_frame_count, queen_seen')
          .in('hive_id', hiveIds)
          .order('hive_id')
          .order('performed_at', { ascending: false }),
        supabase
          .from('queens')
          .select('hive_id')
          .in('hive_id', hiveIds)
          .is('end_date', null),
      ])

      const lastInspMap = new Map<string, { performedAt: string; broodFrameCount: number; honeyFrameCount: number; pollenFrameCount: number; queenSeen: string | null }>()
      for (const insp of inspData ?? []) {
        if (!lastInspMap.has(insp.hive_id)) {
          lastInspMap.set(insp.hive_id, {
            performedAt: insp.performed_at,
            broodFrameCount: insp.brood_frame_count ?? 0,
            honeyFrameCount: insp.honey_frame_count ?? 0,
            pollenFrameCount: insp.pollen_frame_count ?? 0,
            queenSeen: insp.queen_seen ?? null,
          })
        }
      }

      const activeQueenSet = new Set((queensData ?? []).map((q) => q.hive_id))

      return hivesData.map((h) => ({
        id: h.id,
        identifier: h.identifier,
        apiaryId: h.apiary_id ?? apiaryId,
        hiveType: h.hive_type,
        beeRace: h.bee_race,
        nidoFrameCount: (() => {
          const insp = lastInspMap.get(h.id)
          if (insp && (insp.broodFrameCount > 0 || insp.honeyFrameCount > 0 || insp.pollenFrameCount > 0)) {
            return insp.broodFrameCount + insp.honeyFrameCount + insp.pollenFrameCount
          }
          return h.nido_frame_count
        })(),
        melariCount: h.melari_count,
        status: h.status,
        hasApiscampo: h.has_apiscampo,
        hasPropolisNet: h.has_propolis_net,
        hasPollenTrap: h.has_pollen_trap,
        hasActiveQueen: (() => {
          const insp = lastInspMap.get(h.id)
          if (insp?.queenSeen === 'vista') return true
          if (insp?.queenSeen === 'non_cercata') return 'non_cercata'
          if (insp?.queenSeen === 'non_vista') return false
          return activeQueenSet.has(h.id)
        })(),
        lastInspection: lastInspMap.get(h.id) ?? null,
      }))
    },
    enabled: !!apiaryId,
  })
}

type CreateHiveInput = {
  apiaryId: string
  identifier: string
  hiveType: Database['public']['Enums']['hive_type']
  beeRace: Database['public']['Enums']['bee_race']
  installedOn: string | null
  originNotes: string | null
  nidoFrameCount: number
  notes: string | null
}

export function useCreateHive() {
  return useMutation<string, Error, CreateHiveInput>({
    mutationFn: async ({
      apiaryId,
      identifier,
      hiveType,
      beeRace,
      installedOn,
      originNotes,
      nidoFrameCount,
      notes,
    }) => {
      const id = crypto.randomUUID()

      const { error } = await supabase.rpc('create_hive_with_queen', {
        p_id: id,
        p_apiary_id: apiaryId,
        p_identifier: identifier,
        p_hive_type: hiveType,
        p_bee_race: beeRace,
        p_installed_on: installedOn as string,
        p_origin_notes: originNotes as string,
        p_nido_frame_count: nidoFrameCount,
        p_notes: notes as string,
      })

      if (error) throw error

      return id
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['hives', variables.apiaryId] })
      void queryClient.invalidateQueries({ queryKey: ['apiaries'] })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'insert', 'hive', data, `Arnia "${variables.identifier}" creata`)
        }
      })
    },
  })
}

export function useAllHives() {
  return useQuery({
    queryKey: ['hives', 'all'],
    queryFn: async (): Promise<HiveListItem[]> => {
      const { data: hivesData, error: hivesError } = await supabase
        .from('hives')
        .select(
          'id, identifier, apiary_id, hive_type, bee_race, nido_frame_count, melari_count, status, has_apiscampo, has_propolis_net, has_pollen_trap, apiaries(name)',
        )
        .is('archived_at', null)
        .order('identifier', { ascending: true })

      if (hivesError) throw hivesError
      if (!hivesData.length) return []

      const hiveIds = hivesData.map((h) => h.id)

      const [{ data: inspData }, { data: queensData }] = await Promise.all([
        supabase
          .from('inspections')
          .select('hive_id, performed_at, brood_frame_count, honey_frame_count, pollen_frame_count, queen_seen')
          .in('hive_id', hiveIds)
          .order('hive_id')
          .order('performed_at', { ascending: false }),
        supabase
          .from('queens')
          .select('hive_id')
          .in('hive_id', hiveIds)
          .is('end_date', null),
      ])

      const lastInspMap = new Map<string, { performedAt: string; broodFrameCount: number; honeyFrameCount: number; pollenFrameCount: number; queenSeen: string | null }>()
      for (const insp of inspData ?? []) {
        if (!lastInspMap.has(insp.hive_id)) {
          lastInspMap.set(insp.hive_id, {
            performedAt: insp.performed_at,
            broodFrameCount: insp.brood_frame_count ?? 0,
            honeyFrameCount: insp.honey_frame_count ?? 0,
            pollenFrameCount: insp.pollen_frame_count ?? 0,
            queenSeen: insp.queen_seen ?? null,
          })
        }
      }

      const activeQueenSet = new Set((queensData ?? []).map((q) => q.hive_id))

      return hivesData.map((h) => ({
        id: h.id,
        identifier: h.identifier,
        apiaryId: h.apiary_id ?? '',
        apiaryName: Array.isArray(h.apiaries) ? h.apiaries[0]?.name : (h.apiaries as { name: string } | null)?.name,
        hiveType: h.hive_type,
        beeRace: h.bee_race,
        nidoFrameCount: (() => {
          const insp = lastInspMap.get(h.id)
          if (insp && (insp.broodFrameCount > 0 || insp.honeyFrameCount > 0 || insp.pollenFrameCount > 0)) {
            return insp.broodFrameCount + insp.honeyFrameCount + insp.pollenFrameCount
          }
          return h.nido_frame_count
        })(),
        melariCount: h.melari_count,
        status: h.status,
        hasApiscampo: h.has_apiscampo,
        hasPropolisNet: h.has_propolis_net,
        hasPollenTrap: h.has_pollen_trap,
        hasActiveQueen: (() => {
          const insp = lastInspMap.get(h.id)
          if (insp?.queenSeen === 'vista') return true
          if (insp?.queenSeen === 'non_cercata') return 'non_cercata'
          if (insp?.queenSeen === 'non_vista') return false
          return activeQueenSet.has(h.id)
        })(),
        lastInspection: lastInspMap.get(h.id) ?? null,
      }))
    },
  })
}

type UpdateHiveInput = {
  hiveId: string
  apiaryId: string
  identifier: string
  hiveType: Database['public']['Enums']['hive_type']
  beeRace: Database['public']['Enums']['bee_race']
  installedOn: string | null
  originNotes: string | null
  nidoFrameCount: number
  notes: string | null
}

export function useUpdateHive() {
  return useMutation({
    mutationFn: async ({
      hiveId,
      apiaryId: _apiaryId,
      identifier,
      hiveType,
      beeRace,
      installedOn,
      originNotes,
      nidoFrameCount,
      notes,
    }: UpdateHiveInput) => {
      const { error } = await supabase.from('hives').update({
        identifier,
        hive_type: hiveType,
        bee_race: beeRace,
        installed_on: installedOn as string,
        origin_notes: originNotes as string,
        nido_frame_count: nidoFrameCount,
        notes: notes as string,
      }).eq('id', hiveId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['hives', variables.apiaryId] })
      void queryClient.invalidateQueries({ queryKey: ['hives', 'all'] })
      void queryClient.invalidateQueries({ queryKey: ['hive'] })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'update', 'hive', variables.hiveId, `Arnia "${variables.identifier}" modificata`)
        }
      })
    },
  })
}

export function useToggleHiveAccessory() {
  return useMutation({
    mutationFn: async ({
      hiveId,
      field,
      value,
    }: {
      hiveId: string
      field: 'has_apiscampo' | 'has_propolis_net' | 'has_pollen_trap'
      value: boolean
    }) => {
      const update =
        field === 'has_apiscampo'    ? { has_apiscampo: value } :
        field === 'has_propolis_net' ? { has_propolis_net: value } :
                                       { has_pollen_trap: value }
      const { error } = await supabase.from('hives').update(update).eq('id', hiveId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
    },
  })
}

export function useUpdateMelariCount() {
  return useMutation({
    mutationFn: async ({ hiveId, count }: { hiveId: string; count: number }) => {
      const { error } = await supabase.from('hives').update({ melari_count: count }).eq('id', hiveId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
    },
  })
}

export function useDeleteHive() {
  return useMutation<string, Error, string>({
    mutationFn: async (hiveId) => {
      const { data: hive } = await supabase
        .from('hives')
        .select('identifier')
        .eq('id', hiveId)
        .single()
      const identifier = hive?.identifier ?? ''

      const { error } = await supabase
        .from('hives')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', hiveId)
      if (error) throw error

      return identifier
    },
    onSuccess: (identifier) => {
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
      void queryClient.invalidateQueries({ queryKey: ['apiaries'] })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'delete', 'hive', null, `Arnia "${identifier}" eliminata`)
        }
      })
    },
  })
}
