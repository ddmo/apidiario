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
  const keys = await db.cache.keys()
  if (keys.length > 0) {
    await db.cache.clear()
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minuti
      gcTime: 1000 * 60 * 60 * 24,    // 24 ore (persiste in IndexedDB)
      retry: 1,
    },
  },
})
