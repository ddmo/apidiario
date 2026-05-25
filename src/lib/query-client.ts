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
      staleTime: 0,                    // sempre fresco se online
      gcTime: 1000 * 60 * 60 * 24,    // 24 ore (fallback offline in IndexedDB)
      retry: 1,
    },
  },
})
