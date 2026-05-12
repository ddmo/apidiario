import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type MediaRow = Tables<'inspection_media'> & { signedUrl?: string }

export interface PendingMediaItem {
  id: string
  previewUrl: string
  file: File
}

async function uploadFiles(files: { file: File }[], inspId: string): Promise<MediaRow[]> {
  const newMedia: MediaRow[] = []
  for (const { file } of files) {
    const id = crypto.randomUUID()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    const path = `inspections/${inspId}/media/${id}.${ext}`
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
      .insert({ inspection_id: inspId, storage_path: path, media_type: mediaType })
      .select('*')
      .single()
    if (dbError) {
      console.error('[mediaDbInsert]', dbError)
      continue
    }
    newMedia.push({ ...row, signedUrl: signed?.signedUrl })
  }
  return newMedia
}

export function useInspectionMedia(inspectionId: string | null) {
  const [media, setMedia] = useState<MediaRow[]>([])
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([])
  const [uploading, setUploading] = useState(false)

  // Load existing media
  useEffect(() => {
    if (!inspectionId) return
    let cancelled = false
    async function load(id: string) {
      const { data } = await supabase
        .from('inspection_media')
        .select('*')
        .eq('inspection_id', id)
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
    load(inspectionId)
    return () => { cancelled = true }
  }, [inspectionId])

  // Cleanup pending object URLs on unmount
  useEffect(() => {
    return () => {
      for (const p of pendingMedia) {
        URL.revokeObjectURL(p.previewUrl)
      }
    }
  }, [pendingMedia])

  const pickFiles = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.multiple = true
    input.onchange = async () => {
      const files = input.files
      if (!files?.length) return

      // Create local previews for all selected files
      const pending: PendingMediaItem[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        file,
      }))

      if (!inspectionId) {
        setPendingMedia((prev) => [...prev, ...pending])
        return
      }

      setUploading(true)
      const uploaded = await uploadFiles(pending, inspectionId)
      // Revoke local previews since real URLs will be used
      for (const p of pending) URL.revokeObjectURL(p.previewUrl)
      setMedia((prev) => [...prev, ...uploaded])
      setUploading(false)
    }
    input.click()
  }, [inspectionId])

  const commit = useCallback(async (id: string) => {
    if (pendingMedia.length === 0) return
    const pending = pendingMedia
    setPendingMedia([])
    setUploading(true)
    const uploaded = await uploadFiles(pending, id)
    for (const p of pending) URL.revokeObjectURL(p.previewUrl)
    setMedia((prev) => [...prev, ...uploaded])
    setUploading(false)
  }, [pendingMedia])

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

  const removePending = useCallback((id: string) => {
    setPendingMedia((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  return { media, pendingMedia, uploading, pickFiles, removeMedia, removePending, commit }
}
