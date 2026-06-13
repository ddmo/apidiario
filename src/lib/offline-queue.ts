import Dexie, { type Table } from 'dexie'

export interface PendingMutation {
  id: string
  type: string
  payload: string       // JSON
  queryKeys: string     // JSON array of QueryKey[]
  createdAt: number
  attempts: number
}

// Mutation che ha superato il numero massimo di tentativi di sync.
// Tenuta separata per non bloccare la coda e per poterla mostrare all'utente.
export interface DeadMutation extends PendingMutation {
  failedAt: number
  lastError: string
}

class OfflineQueueDb extends Dexie {
  mutations!: Table<PendingMutation, string>
  dead!: Table<DeadMutation, string>

  constructor() {
    super('apidiario-offline-queue')
    this.version(1).stores({ mutations: 'id,createdAt,type' })
    this.version(2).stores({
      mutations: 'id,createdAt,type',
      dead: 'id,failedAt,type',
    })
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

  async incrementAttempts(id: string): Promise<number> {
    await db.mutations.where('id').equals(id).modify((m) => { m.attempts += 1 })
    const row = await db.mutations.get(id)
    return row?.attempts ?? 0
  },

  // Sposta una mutation nel dead-letter store e la rimuove dalla coda attiva.
  async moveToDead(m: PendingMutation, lastError: string): Promise<void> {
    await db.transaction('rw', db.mutations, db.dead, async () => {
      await db.dead.put({ ...m, failedAt: Date.now(), lastError })
      await db.mutations.delete(m.id)
    })
    notify()
  },

  async getDead(): Promise<DeadMutation[]> {
    return db.dead.orderBy('failedAt').toArray()
  },

  async removeDead(id: string): Promise<void> {
    await db.dead.delete(id)
    notify()
  },

  async deadCount(): Promise<number> {
    return db.dead.count()
  },
}
