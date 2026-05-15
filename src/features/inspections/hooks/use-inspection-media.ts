import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { uuid } from '@/lib/utils'
import type { Tables } from '@/types/database'

type MediaRow = Tables<'inspection_media'> & { signedUrl?: string }

export interface PendingMediaItem {
  id: string
  previewUrl: string
  file: File
}

async function uploadFiles(files: { file: File }[], inspId: string): Promise<MediaRow[]> {
  const newMedia: MediaRow[] = []
  console.log('[mediaUpload] uploadFiles start, files:', files.length, 'inspId:', inspId)
  for (let i = 0; i < files.length; i++) {
    const item = files[i]
    if (!item) continue
    const { file } = item
    const id = uuid()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    const path = `inspections/${inspId}/media/${id}.${ext}`
    console.log('[mediaUpload] uploading', i + 1, '/', files.length, file.name, 'size:', file.size, 'type:', file.type)
    const { error: uploadError } = await supabase.storage
      .from('apidiario-media')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) {
      console.error('[mediaUpload] upload error for', file.name, uploadError)
      continue
    }
    console.log('[mediaUpload] upload OK, creating signedUrl and DB row')
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
  console.log('[mediaUpload] uploadFiles done, uploaded:', newMedia.length)
  return newMedia
}

export function useInspectionMedia(inspectionId: string | null) {
  const [media, setMedia] = useState<MediaRow[]>([])
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

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

  const handleMediaFiles = useCallback(async (files: File[]) => {
    if (!files.length) return
    console.log('[mediaUpload] handleMediaFiles start', files.length, 'files', files.map(f => ({ name: f.name, type: f.type, size: f.size })))

    const pending: PendingMediaItem[] = Array.from(files).map((file) => ({
      id: uuid(),
      previewUrl: URL.createObjectURL(file),
      file,
    }))

    // Show items immediately so user gets feedback
    setPendingMedia((prev) => [...prev, ...pending])
    console.log('[mediaUpload] pending items set, count:', pending.length, 'inspectionId:', inspectionId)

    if (!inspectionId) {
      console.log('[mediaUpload] no inspectionId, items stay pending')
      showToast('File selezionati — salva per caricarli', 'success')
      return
    }

    setUploading(true)
    showToast(`Caricamento ${pending.length} file…`, 'success')
    console.log('[mediaUpload] uploading=true, starting upload...')
    const uploaded = await uploadFiles(pending, inspectionId)
    console.log('[mediaUpload] upload complete:', uploaded.length, 'uploaded,', pending.length - uploaded.length, 'failed')
    // Remove from pending, add as uploaded media
    setPendingMedia((prev) => prev.filter((p) => !pending.some((x) => x.id === p.id)))
    for (const p of pending) URL.revokeObjectURL(p.previewUrl)
    setMedia((prev) => [...prev, ...uploaded])
    setUploading(false)
    console.log('[mediaUpload] uploading=false, media updated')
    if (uploaded.length === pending.length) {
      showToast(`Caricati ${uploaded.length} file`, 'success')
    } else if (uploaded.length > 0) {
      showToast(`Caricati ${uploaded.length}/${pending.length} file — alcuni hanno superato il limite di 20 MB`, 'error')
    } else {
      showToast('Nessun file caricato (limite 20 MB per file)', 'error')
    }
  }, [inspectionId, showToast])

  const pickFiles = useCallback(() => {
    console.log('[mediaUpload] pickFiles called')
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.multiple = true
    input.style.position = 'absolute'
    input.style.opacity = '0'
    input.style.pointerEvents = 'none'
    input.onchange = () => {
      const files = input.files
      if (input.parentNode) input.parentNode.removeChild(input)
      if (!files?.length) return
      console.log('[mediaUpload] files selected via pickFiles:', files.length)
      handleMediaFiles(Array.from(files))
    }
    document.body.appendChild(input)
    input.click()
  }, [handleMediaFiles])

  const commit = useCallback(async (id: string) => {
    if (pendingMedia.length === 0) {
      console.log('[mediaUpload] commit called but no pending media')
      return
    }
    console.log('[mediaUpload] commit start, pending:', pendingMedia.length, 'files, inspectionId:', id)
    const pending = pendingMedia
    setPendingMedia([])
    showToast(`Caricamento ${pending.length} file…`, 'success')
    setUploading(true)
    const uploaded = await uploadFiles(pending, id)
    console.log('[mediaUpload] commit upload complete:', uploaded.length, 'uploaded,', pending.length - uploaded.length, 'failed')
    for (const p of pending) URL.revokeObjectURL(p.previewUrl)
    setMedia((prev) => [...prev, ...uploaded])
    setUploading(false)
    if (uploaded.length === pending.length) {
      showToast(`Caricati ${uploaded.length} file`, 'success')
    } else if (uploaded.length > 0) {
      showToast(`Caricati ${uploaded.length}/${pending.length} file — alcuni hanno superato il limite di 20 MB`, 'error')
    } else {
      showToast('Nessun file caricato (limite 20 MB per file)', 'error')
    }
  }, [pendingMedia, showToast])

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

  return { media, pendingMedia, uploading, pickFiles, handleMediaFiles, removeMedia, removePending, commit }
}
