import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type MediaRow = Tables<'inspection_media'> & { signedUrl?: string }

export function useInspectionMedia(inspectionId: string | null) {
  const [media, setMedia] = useState<MediaRow[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement | null>(null)

  // Load existing media
  useEffect(() => {
    if (!inspectionId) return
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('inspection_media')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: true })
      if (cancelled || !data) return
      const withUrls = await Promise.all(
        data.map(async (row) => {
          const { data: signed } = await supabase.storage
            .from('apidiario-media')
            .createSignedUrl(row.storage_path, 3600)
          return { ...row, signedUrl: signed?.signedUrl }
        }),
      )
      setMedia(withUrls)
    }
    load()
    return () => { cancelled = true }
  }, [inspectionId])

  const pickFiles = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.multiple = true
    input.onchange = async () => {
      const files = input.files
      if (!files?.length || !inspectionId) return
      setUploading(true)
      const newMedia: MediaRow[] = []
      for (const file of Array.from(files)) {
        const id = crypto.randomUUID()
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
        const path = `inspections/${inspectionId}/media/${id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('apidiario-media')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (uploadError) {
          console.error('[mediaUpload]', uploadError)
          continue
        }
        const { data: signed } = await supabase.storage
          .from('apidiario-media')
          .createSignedUrl(path, 3600)
        const { data: row, error: dbError } = await supabase
          .from('inspection_media')
          .insert({ inspection_id: inspectionId, storage_path: path, media_type: mediaType })
          .select('*')
          .single()
        if (dbError) {
          console.error('[mediaDbInsert]', dbError)
          continue
        }
        newMedia.push({ ...row, signedUrl: signed?.signedUrl })
      }
      setMedia((prev) => [...prev, ...newMedia])
      setUploading(false)
    }
    input.click()
  }, [inspectionId])

  const removeMedia = useCallback(
    async (id: string) => {
      const item = media.find((m) => m.id === id)
      if (!item) return
      await supabase.storage.from('apidiario-media').remove([item.storage_path])
      await supabase.from('inspection_media').delete().eq('id', id)
      setMedia((prev) => prev.filter((m) => m.id !== id))
    },
    [media],
  )

  return { media, uploading, pickFiles, removeMedia }
}
