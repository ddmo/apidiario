import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'
import type { Tables, TablesInsert } from '@/types/database'

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
      const id = crypto.randomUUID()

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['apiaries'] })
    },
  })
}
