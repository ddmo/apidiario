import Dexie, { type Table } from 'dexie'

export interface PendingMutation {
  id: string
  type: string
  payload: string       // JSON
  queryKeys: string     // JSON array of QueryKey[]
  createdAt: number
  attempts: number
}

class OfflineQueueDb extends Dexie {
  mutations!: Table<PendingMutation, string>

  constructor() {
    super('apidiario-offline-queue')
    this.version(1).stores({ mutations: 'id,createdAt,type' })
  }
}

const db = new OfflineQueueDb()

function notify() {
  window.dispatchEvent(new CustomEvent('offline-queue-changed'))
}

export const offlineQueue = {
  async add(type: string, payload: unknown, queryKeys: unknown[][]): Promise<void> {
    await db.mutations.add({
      id: crypto.randomUUID(),
      type,
      payload: JSON.stringify(payload),
      queryKeys: JSON.stringify(queryKeys),
      createdAt: Date.now(),
      attempts: 0,
    })
    notify()
  },

  async getAll(): Promise<PendingMutation[]> {
    return db.mutations.orderBy('createdAt').toArray()
  },

  async remove(id: string): Promise<void> {
    await db.mutations.delete(id)
    notify()
  },

  async count(): Promise<number> {
    return db.mutations.count()
  },

  async incrementAttempts(id: string): Promise<void> {
    await db.mutations.where('id').equals(id).modify(m => { m.attempts += 1 })
  },
}
