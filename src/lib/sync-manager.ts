import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { offlineQueue, type PendingMutation } from '@/lib/offline-queue'
import type { QueryKey } from '@tanstack/react-query'

let syncing = false

// Oltre questo numero di tentativi falliti la mutation va in dead-letter:
// non si ritenta più all'infinito (es. payload invalido, vincolo DB violato).
const MAX_ATTEMPTS = 5

function notifySyncState() {
  window.dispatchEvent(new CustomEvent('sync-state-changed', { detail: { syncing } }))
}

async function handleMutation(m: PendingMutation): Promise<void> {
  const payload = JSON.parse(m.payload) as Record<string, unknown>

  switch (m.type) {
    case 'createInspection': {
      const { error } = await supabase.from('inspections').insert(payload as never)
      if (error) throw error
      break
    }
    case 'toggleHiveAccessory': {
      const { hiveId, field, value } = payload as {
        hiveId: string
        field: 'has_apiscampo' | 'has_propolis_net' | 'has_pollen_trap'
        value: boolean
      }
      const update =
        field === 'has_apiscampo'    ? { has_apiscampo: value } :
        field === 'has_propolis_net' ? { has_propolis_net: value } :
                                       { has_pollen_trap: value }
      const { error } = await supabase.from('hives').update(update).eq('id', hiveId)
      if (error) throw error
      break
    }
    case 'updateMelariCount': {
      const { hiveId, count } = payload as { hiveId: string; count: number }
      const { error } = await supabase.from('hives').update({ melari_count: count }).eq('id', hiveId)
      if (error) throw error
      break
    }
    default:
      // Tipo non riconosciuto — rimuovi dalla queue per non bloccare
      console.warn('[syncManager] tipo mutation sconosciuto:', m.type)
  }
}

export async function syncPending(): Promise<void> {
  if (syncing) return
  const pending = await offlineQueue.getAll()
  if (pending.length === 0) return

  // Rinnova il JWT prima di tentare le chiamate — dopo un lungo periodo offline
  // il token potrebbe essere scaduto. Se il refresh fallisce (refresh token scaduto
  // o revocato) la sync viene rinviata finché l'utente non ri-effettua il login.
  const { error: sessionError } = await supabase.auth.refreshSession()
  if (sessionError) {
    console.warn('[syncManager] sessione non rinnovabile, sync rinviata:', sessionError.message)
    return
  }

  syncing = true
  notifySyncState()

  for (const mutation of pending) {
    try {
      await handleMutation(mutation)
      await offlineQueue.remove(mutation.id)
      // Invalida le query associate
      const keys: QueryKey[] = JSON.parse(mutation.queryKeys) as QueryKey[]
      for (const key of keys) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    } catch (err) {
      console.error('[syncManager] sync fallita per', mutation.type, err)
      const attempts = await offlineQueue.incrementAttempts(mutation.id)
      if (attempts >= MAX_ATTEMPTS) {
        const message = err instanceof Error ? err.message : String(err)
        await offlineQueue.moveToDead(mutation, message)
        console.warn('[syncManager] mutation spostata in dead-letter dopo', attempts, 'tentativi:', mutation.type)
      }
      // Continua con le altre mutation anche se una fallisce
    }
  }

  syncing = false
  notifySyncState()
}

export function initSyncManager(): void {
  // Sync immediato al rientro online
  window.addEventListener('online', () => {
    void syncPending()
  })

  // Tenta sync all'avvio se già online e ci sono pending
  if (navigator.onLine) {
    void syncPending()
  }
}
