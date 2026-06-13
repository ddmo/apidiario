import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'
import { uuid } from '@/lib/utils'
import { logActivity } from '@/lib/activity-log'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

// Augmented row type — main_photo_path already in generated types.
// hives embedded via PostgREST select, resolved to a count client-side.
type ApiaryRow = Tables<'apiaries'> & {
  hives: { id: string }[]
}

export type ApiaryListItem = {
  id: string
  name: string
  hiveCount: number
  photoUrl: string | null
  sharedCount: number
}

export type ApiaryDetail = {
  id: string
  name: string
  bda_codice_aziendale: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  notes: string | null
  main_photo_path: string | null
  photoUrl: string | null
}

export function useApiary(apiaryId: string) {
  return useQuery({
    queryKey: ['apiary', apiaryId],
    queryFn: async (): Promise<ApiaryDetail> => {
      const { data, error } = await supabase
        .from('apiaries')
        .select('id, name, bda_codice_aziendale, latitude, longitude, address, notes, main_photo_path')
        .eq('id', apiaryId)
        .single()
      if (error) throw error

      let photoUrl: string | null = null
      if (data.main_photo_path) {
        const { data: signed } = await supabase.storage
          .from('apidiario-media')
          .createSignedUrl(data.main_photo_path, 3600)
        photoUrl = signed?.signedUrl ?? null
      }

      return { ...data, photoUrl } as ApiaryDetail
    },
    enabled: !!apiaryId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useApiaries() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['apiaries'],
    queryFn: async (): Promise<ApiaryListItem[]> => {
      const { data, error } = await supabase
        .from('apiaries')
        .select('id, name, main_photo_path, hives(id)')
        .is('archived_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      const rows = data as unknown as ApiaryRow[]

      // Batch-sign photo URLs for apiaries that have a stored path
      const rowsWithPhoto = rows.filter(
        (r): r is ApiaryRow & { main_photo_path: string } => r.main_photo_path !== null,
      )
      const signedMap: Record<string, string> = {}

      if (rowsWithPhoto.length > 0) {
        const { data: signed } = await supabase.storage
          .from('apidiario-media')
          .createSignedUrls(
            rowsWithPhoto.map((r) => r.main_photo_path),
            3600,
          )
        for (const [i, row] of rowsWithPhoto.entries()) {
          const url = signed?.[i]?.signedUrl
          if (url) signedMap[row.id] = url
        }
      }

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        hiveCount: Array.isArray(r.hives) ? r.hives.length : 0,
        photoUrl: signedMap[r.id] ?? null,
        sharedCount: 0,
      }))
    },
    enabled: !!session?.user?.id,
  })
}

// ─────────────────────────────────────────────────────────────
// Create apiary — Strategy A:
//   1. INSERT row (no photo yet)
//   2. Upload compressed photo → apiaries/{id}/main.{ext}
//   3. UPDATE main_photo_path
// If photo upload fails, apiary is still saved; caller receives photoFailed flag.
// ─────────────────────────────────────────────────────────────

type CreateApiaryInput = {
  name: string
  bda_codice_aziendale?: string | null
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  notes?: string | null
  photoFile?: File | null
  userId: string
}

export type CreateApiaryResult = {
  id: string
  photoFailed?: boolean
}

export function useCreateApiary() {
  return useMutation<CreateApiaryResult, Error, CreateApiaryInput>({
    mutationFn: async ({
      name,
      bda_codice_aziendale,
      latitude,
      longitude,
      address,
      notes,
      photoFile,
      userId,
    }) => {
      // Step 1: INSERT — UUID pre-generated client-side to avoid ?select=id
      // which triggers a RETURNING SELECT hitting a RLS recursion issue in
      // user_can_read_apiary on the newly-inserted row.
      const id = uuid()

      const payload: TablesInsert<'apiaries'> = {
        id,
        name,
        owner_id: userId,
        bda_codice_aziendale: bda_codice_aziendale ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        address: address ?? null,
        notes: notes ?? null,
      }

      const { error: insertError } = await supabase
        .from('apiaries')
        .insert(payload)

      if (insertError) throw insertError

      if (!photoFile) return { id }

      // Step 2: Upload
      const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `apiaries/${id}/main.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('apidiario-media')
        .upload(path, photoFile, { upsert: true })

      if (uploadError) {
        console.error('[uploadPhoto]', uploadError)
        return { id, photoFailed: true }
      }

      // Step 3: UPDATE
      await supabase
        .from('apiaries')
        .update({ main_photo_path: path })
        .eq('id', id)

      return { id }
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['apiaries'] })
      void logActivity(variables.userId, 'insert', 'apiary', data.id, `Apiario "${variables.name}" creato`)
    },
    onError: (err) => { console.error('[useCreateApiary] failed', err) },
  })
}

type UpdateApiaryInput = {
  apiaryId: string
  name: string
  bda_codice_aziendale?: string | null
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  notes?: string | null
  photoFile?: File | null
  removePhoto?: boolean
}

export function useUpdateApiary() {
  return useMutation<void, Error, UpdateApiaryInput>({
    mutationFn: async ({
      apiaryId,
      name,
      bda_codice_aziendale,
      latitude,
      longitude,
      address,
      notes,
      photoFile,
      removePhoto,
    }) => {
      const update: TablesUpdate<'apiaries'> = {
        name,
        bda_codice_aziendale: bda_codice_aziendale ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        address: address ?? null,
        notes: notes ?? null,
        ...(removePhoto ? { main_photo_path: null } : {}),
      }

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `apiaries/${apiaryId}/main.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('apidiario-media')
          .upload(path, photoFile, { upsert: true })
        if (uploadError) {
          console.error('[uploadPhoto]', uploadError)
        } else {
          update.main_photo_path = path
        }
      }

      const { error } = await supabase
        .from('apiaries')
        .update(update)
        .eq('id', apiaryId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['apiaries'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['apiary', variables.apiaryId], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['hives', 'all'], refetchType: 'all' })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'update', 'apiary', variables.apiaryId, `Apiario "${variables.name}" modificato`)
        }
      })
    },
    onError: (err) => { console.error('[useUpdateApiary] failed', err) },
  })
}

export function useDeleteApiary() {
  return useMutation<string, Error, string>({
    mutationFn: async (apiaryId) => {
      const { data: apiary } = await supabase
        .from('apiaries')
        .select('name')
        .eq('id', apiaryId)
        .single()
      const name = apiary?.name ?? ''

      const { error } = await supabase
        .from('apiaries')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', apiaryId)
      if (error) throw error

      return name
    },
    onSuccess: (name) => {
      void queryClient.invalidateQueries({ queryKey: ['apiaries'] })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          void logActivity(session.user.id, 'delete', 'apiary', null, `Apiario "${name}" eliminato`)
        }
      })
    },
    onError: (err) => { console.error('[useDeleteApiary] failed', err) },
  })
}

// ─────────────────────────────────────────────────────────────
// Apiary shares
// ─────────────────────────────────────────────────────────────

export type ApiaryShare = {
  userId: string
  displayName: string
  email?: string
  role: string
  grantedAt: string
}

export function useApiaryShares(apiaryId: string) {
  return useQuery({
    queryKey: ['apiaryShares', apiaryId],
    queryFn: async (): Promise<ApiaryShare[]> => {
      const { data, error } = await supabase
        .from('apiary_access')
        .select('user_id, role, granted_at, profiles!apiary_access_user_id_fkey(display_name)')
        .eq('apiary_id', apiaryId)

      if (error) throw error

      return (data as unknown as {
        user_id: string
        role: string
        granted_at: string
        profiles: { display_name: string } | { display_name: string }[]
      }[]).map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
          userId: row.user_id,
          displayName: profile?.display_name ?? '',
          role: row.role,
          grantedAt: row.granted_at,
        }
      })
    },
    enabled: !!apiaryId,
  })
}

export function useRevokeApiaryAccess() {
  return useMutation({
    mutationFn: async ({ apiaryId, userId }: { apiaryId: string; userId: string }) => {
      const { error } = await supabase
        .from('apiary_access')
        .delete()
        .eq('apiary_id', apiaryId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['apiaryShares', variables.apiaryId] })
      void queryClient.invalidateQueries({ queryKey: ['apiaries'] })
    },
    onError: (err) => { console.error('[useRevokeApiaryAccess] failed', err) },
  })
}
