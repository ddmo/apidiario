import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import Dexie, { type Table } from 'dexie'

interface CacheEntry {
  key: string
  value: string
}

class CacheDb extends Dexie {
  cache!: Table<CacheEntry, string>

  constructor() {
    super('apidiario-query-cache')
    this.version(1).stores({ cache: 'key' })
  }
}

const db = new CacheDb()

const asyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const row = await db.cache.get(key)
    return row?.value ?? null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await db.cache.put({ key, value })
  },
  removeItem: async (key: string): Promise<void> => {
    await db.cache.delete(key)
  },
}

export const persister = createAsyncStoragePersister({
  storage: asyncStorage,
})

export async function clearPersistedCache() {
  await db.cache.clear()
}

const CACHED_USER_KEY = 'apidiario-cached-user'

export async function getCachedUserId(): Promise<string | null> {
  const row = await db.cache.get(CACHED_USER_KEY)
  return row?.value ?? null
}

export async function setCachedUserId(userId: string): Promise<void> {
  await db.cache.put({ key: CACHED_USER_KEY, value: userId })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      // offlineFirst: serve cache IndexedDB immediatamente, tenta fetch in background,
      // se offline resta sui dati cachati senza mostrare errore
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})

const LAST_SYNC_KEY = 'apidiario-last-sync'

export function getLastSyncAt(): number | null {
  try {
    const v = localStorage.getItem(LAST_SYNC_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

// Aggiorna timestamp ogni volta che una query completa con successo
queryClient.getQueryCache().subscribe((event) => {
  if (
    event.type === 'updated' &&
    event.query.state.status === 'success' &&
    event.query.state.dataUpdatedAt > 0
  ) {
    try {
      localStorage.setItem(LAST_SYNC_KEY, event.query.state.dataUpdatedAt.toString())
    } catch { /* ignore */ }
  }
})
