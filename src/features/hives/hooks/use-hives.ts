import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuid } from '@/lib/utils'
import { queryClient } from '@/lib/query-client'
import { offlineQueue } from '@/lib/offline-queue'
import { logActivity } from '@/lib/activity-log'
import { queenColorFromYear } from '../queen-color'
import type { Database } from '@/types/database'

type QueenMarkingColor = Database['public']['Enums']['queen_marking_color']

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
  hasActiveQueen: boolean
  queenMarkingColor: QueenMarkingColor | null
  queenIsMarked: boolean
  needsIntervention: boolean
  lastInspection: { performedAt: string; broodFrameCount: number; honeyFrameCount: number; pollenFrameCount: number; emptyFrameCount: number; queenSeen: string | null } | null
  photoUrl: string | null
}

export function useHivesByApiary(apiaryId: string) {
  return useQuery({
    queryKey: ['hives', apiaryId],
    queryFn: async (): Promise<HiveListItem[]> => {
      const { data: hivesData, error: hivesError } = await supabase
        .from('hives')
        .select(
          'id, identifier, apiary_id, hive_type, bee_race, nido_frame_count, melari_count, status, has_apiscampo, has_propolis_net, has_pollen_trap, main_photo_path',
        )
        .eq('apiary_id', apiaryId)
        .is('archived_at', null)

      if (hivesError) throw hivesError
      if (!hivesData.length) return []

      // Batch-sign photo URLs
      const photoUrls = new Map<string, string | null>()
      for (const row of hivesData) {
        const path = (row as unknown as { main_photo_path: string | null }).main_photo_path
        if (path) {
          const { data: signed } = await supabase.storage
            .from('apidiario-media')
            .createSignedUrl(path, 3600)
          photoUrls.set(row.id, signed?.signedUrl ?? null)
        } else {
          photoUrls.set(row.id, null)
        }
      }

      const hiveIds = hivesData.map((h) => h.id)

      const [{ data: inspData }, { data: queensData }] = await Promise.all([
        supabase
          .from('inspections')
          .select('hive_id, performed_at, brood_frame_count, honey_frame_count, pollen_frame_count, empty_frame_count, queen_seen, brood_eggs, needs_intervention')
          .in('hive_id', hiveIds)
          .order('hive_id')
          .order('performed_at', { ascending: false }),
        supabase
          .from('queens')
          .select('hive_id, is_marked, birth_year')
          .in('hive_id', hiveIds)
          .is('end_date', null),
      ])

      const lastInspMap = new Map<string, { performedAt: string; broodFrameCount: number; honeyFrameCount: number; pollenFrameCount: number; emptyFrameCount: number; queenSeen: string | null; broodEggs: boolean; needsIntervention: boolean }>()
      for (const insp of inspData ?? []) {
        if (!lastInspMap.has(insp.hive_id)) {
          lastInspMap.set(insp.hive_id, {
            performedAt: insp.performed_at,
            broodFrameCount: insp.brood_frame_count ?? 0,
            honeyFrameCount: insp.honey_frame_count ?? 0,
            pollenFrameCount: insp.pollen_frame_count ?? 0,
            emptyFrameCount: insp.empty_frame_count ?? 0,
            queenSeen: insp.queen_seen ?? null,
            broodEggs: insp.brood_eggs ?? false,
            needsIntervention: insp.needs_intervention ?? false,
          })
        }
      }

      type QueenInfo = { is_marked: boolean; birth_year: number | null }
      const queenInfoMap = new Map<string, QueenInfo>()
      for (const q of queensData ?? []) {
        queenInfoMap.set(q.hive_id, { is_marked: q.is_marked, birth_year: q.birth_year })
      }

      // Colore derivato dall'anno di nascita, solo se la regina è marcata.
      function getQueenColor(hiveId: string): QueenMarkingColor | null {
        const q = queenInfoMap.get(hiveId)
        if (!q || !q.is_marked) return null
        if (q.birth_year) return queenColorFromYear(q.birth_year)
        return null
      }
      function getQueenIsMarked(hiveId: string): boolean {
        return queenInfoMap.get(hiveId)?.is_marked ?? false
      }

      return hivesData.map((h) => ({
        id: h.id,
        identifier: h.identifier,
        apiaryId: h.apiary_id ?? apiaryId,
        hiveType: h.hive_type,
        beeRace: h.bee_race,
        nidoFrameCount: (() => {
          const insp = lastInspMap.get(h.id)
          if (insp && (insp.broodFrameCount > 0 || insp.honeyFrameCount > 0 || insp.pollenFrameCount > 0 || insp.emptyFrameCount > 0)) {
            return insp.broodFrameCount + insp.honeyFrameCount + insp.pollenFrameCount + insp.emptyFrameCount
          }
          return h.nido_frame_count
        })(),
        melariCount: h.melari_count,
        status: h.status,
        hasApiscampo: h.has_apiscampo,
        hasPropolisNet: h.has_propolis_net,
        hasPollenTrap: h.has_pollen_trap,
        hasActiveQueen: ((): boolean => {
          const insp = lastInspMap.get(h.id)
          if (!insp) return queenInfoMap.has(h.id)
          if (insp.queenSeen === 'vista') return true
          // Non vista / non cercata: le uova fresche provano che la regina era attiva di recente.
          return insp.broodEggs
        })(),
        queenMarkingColor: getQueenColor(h.id),
        queenIsMarked: getQueenIsMarked(h.id),
        needsIntervention: lastInspMap.get(h.id)?.needsIntervention ?? false,
        lastInspection: lastInspMap.get(h.id) ?? null,
        photoUrl: photoUrls.get(h.id) ?? null,
      })).sort((a, b) => {
        // Arnie che necessitano intervento sempre per prime
        if (a.needsIntervention !== b.needsIntervention) return a.needsIntervention ? -1 : 1
        return a.identifier.localeCompare(b.identifier, 'it', { numeric: true, sensitivity: 'base' })
      })
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
      const id = uuid()

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
    onError: (err) => { console.error('[useCreateHive] failed', err) },
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
          .select('hive_id, performed_at, brood_frame_count, honey_frame_count, pollen_frame_count, empty_frame_count, queen_seen, brood_eggs, needs_intervention')
          .in('hive_id', hiveIds)
          .order('hive_id')
          .order('performed_at', { ascending: false }),
        supabase
          .from('queens')
          .select('hive_id, is_marked, birth_year')
          .in('hive_id', hiveIds)
          .is('end_date', null),
      ])

      const lastInspMap = new Map<string, { performedAt: string; broodFrameCount: number; honeyFrameCount: number; pollenFrameCount: number; emptyFrameCount: number; queenSeen: string | null; broodEggs: boolean; needsIntervention: boolean }>()
      for (const insp of inspData ?? []) {
        if (!lastInspMap.has(insp.hive_id)) {
          lastInspMap.set(insp.hive_id, {
            performedAt: insp.performed_at,
            broodFrameCount: insp.brood_frame_count ?? 0,
            honeyFrameCount: insp.honey_frame_count ?? 0,
            pollenFrameCount: insp.pollen_frame_count ?? 0,
            emptyFrameCount: insp.empty_frame_count ?? 0,
            queenSeen: insp.queen_seen ?? null,
            broodEggs: insp.brood_eggs ?? false,
            needsIntervention: insp.needs_intervention ?? false,
          })
        }
      }

      type QueenInfo = { is_marked: boolean; birth_year: number | null }
      const queenInfoMap = new Map<string, QueenInfo>()
      for (const q of queensData ?? []) {
        queenInfoMap.set(q.hive_id, { is_marked: q.is_marked, birth_year: q.birth_year })
      }

      // Colore derivato dall'anno di nascita, solo se la regina è marcata.
      function getQueenColor(hiveId: string): QueenMarkingColor | null {
        const q = queenInfoMap.get(hiveId)
        if (!q || !q.is_marked) return null
        if (q.birth_year) return queenColorFromYear(q.birth_year)
        return null
      }
      function getQueenIsMarked(hiveId: string): boolean {
        return queenInfoMap.get(hiveId)?.is_marked ?? false
      }

      return hivesData.map((h) => ({
        id: h.id,
        identifier: h.identifier,
        apiaryId: h.apiary_id ?? '',
        apiaryName: Array.isArray(h.apiaries) ? h.apiaries[0]?.name : (h.apiaries as { name: string } | null)?.name,
        hiveType: h.hive_type,
        beeRace: h.bee_race,
        nidoFrameCount: (() => {
          const insp = lastInspMap.get(h.id)
          if (insp && (insp.broodFrameCount > 0 || insp.honeyFrameCount > 0 || insp.pollenFrameCount > 0 || insp.emptyFrameCount > 0)) {
            return insp.broodFrameCount + insp.honeyFrameCount + insp.pollenFrameCount + insp.emptyFrameCount
          }
          return h.nido_frame_count
        })(),
        melariCount: h.melari_count,
        status: h.status,
        hasApiscampo: h.has_apiscampo,
        hasPropolisNet: h.has_propolis_net,
        hasPollenTrap: h.has_pollen_trap,
        hasActiveQueen: ((): boolean => {
          const insp = lastInspMap.get(h.id)
          if (!insp) return queenInfoMap.has(h.id)
          if (insp.queenSeen === 'vista') return true
          // Non vista / non cercata: le uova fresche provano che la regina era attiva di recente.
          return insp.broodEggs
        })(),
        queenMarkingColor: getQueenColor(h.id),
        queenIsMarked: getQueenIsMarked(h.id),
        needsIntervention: lastInspMap.get(h.id)?.needsIntervention ?? false,
        lastInspection: lastInspMap.get(h.id) ?? null,
        photoUrl: null,
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
  photoFile?: File | null
  removePhoto?: boolean
}

export function useUpdateHive() {
  return useMutation({
    mutationFn: async ({
      hiveId,
      apiaryId,
      identifier,
      hiveType,
      beeRace,
      installedOn,
      originNotes,
      nidoFrameCount,
      notes,
      photoFile,
      removePhoto,
    }: UpdateHiveInput) => {
      const update: Partial<Database['public']['Tables']['hives']['Update']> = {
        identifier,
        hive_type: hiveType,
        bee_race: beeRace,
        installed_on: installedOn as string,
        origin_notes: originNotes as string,
        nido_frame_count: nidoFrameCount,
        notes: notes as string,
        apiary_id: apiaryId,
      }

      if (removePhoto) {
        update.main_photo_path = null
      }

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `hives/${hiveId}/main.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('apidiario-media')
          .upload(path, photoFile, { upsert: true })

        if (uploadError) {
          console.error('[hive uploadPhoto]', uploadError)
        } else {
          update.main_photo_path = path
        }
      }

      const { error } = await supabase.from('hives').update(update).eq('id', hiveId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['hives'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['hive', variables.hiveId], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['apiaries'], refetchType: 'all' })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'update', 'hive', variables.hiveId, `Arnia "${variables.identifier}" modificata`)
        }
      })
    },
    onError: (err) => { console.error('[useUpdateHive] failed', err) },
  })
}

const ACCESSORY_CAMEL: Record<string, keyof HiveListItem> = {
  has_apiscampo:    'hasApiscampo',
  has_propolis_net: 'hasPropolisNet',
  has_pollen_trap:  'hasPollenTrap',
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
      if (!navigator.onLine) {
        // Optimistic cache update su tutti i query ['hives', *]
        queryClient.setQueriesData<HiveListItem[]>(
          { predicate: q => q.queryKey[0] === 'hives' },
          old => Array.isArray(old)
            ? old.map(h => h.id === hiveId ? { ...h, [ACCESSORY_CAMEL[field]!]: value } : h)
            : old,
        )
        await offlineQueue.add('toggleHiveAccessory', { hiveId, field, value }, [['hives']])
        return
      }
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
    onError: (err) => { console.error('[useToggleHiveAccessory] failed', err) },
  })
}

export function useUpdateMelariCount() {
  return useMutation({
    mutationFn: async ({ hiveId, count }: { hiveId: string; count: number }) => {
      if (!navigator.onLine) {
        queryClient.setQueriesData<HiveListItem[]>(
          { predicate: q => q.queryKey[0] === 'hives' },
          old => Array.isArray(old)
            ? old.map(h => h.id === hiveId ? { ...h, melariCount: count } : h)
            : old,
        )
        await offlineQueue.add('updateMelariCount', { hiveId, count }, [['hives']])
        return
      }
      const { error } = await supabase.from('hives').update({ melari_count: count }).eq('id', hiveId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
    },
    onError: (err) => { console.error('[useUpdateMelariCount] failed', err) },
  })
}

export function useUpsertQueen() {
  return useMutation({
    mutationFn: async ({
      hiveId,
      isMarked,
      birthYear,
    }: {
      hiveId: string
      isMarked: boolean
      birthYear: number | null
    }) => {
      const { data: existing } = await supabase
        .from('queens')
        .select('id')
        .eq('hive_id', hiveId)
        .is('end_date', null)
        .maybeSingle()

      const payload = {
        is_marked: isMarked,
        birth_year: birthYear,
        start_date: existing ? undefined : new Date().toISOString().slice(0, 10),
      }

      if (existing) {
        const { error } = await supabase
          .from('queens')
          .update(payload)
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('queens')
          .insert({ hive_id: hiveId, ...payload })
        if (error) throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
    },
    onError: (err) => { console.error("[src/features/hives/hooks/use-hives.ts] mutation failed", err) },
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
    onError: (err) => { console.error('[useDeleteHive] failed', err) },
  })
}
