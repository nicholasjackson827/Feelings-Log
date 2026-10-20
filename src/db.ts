import Dexie, { liveQuery, type EntityTable } from 'dexie'
import { useEffect, useState } from 'react'
import type { CheckIn } from './types'

export const db = new Dexie('feelings-log') as Dexie & {
  checkins: EntityTable<CheckIn, 'id'>
}

db.version(1).stores({
  checkins: 'id, timestamp',
})

/** All check-ins, newest first. */
export const allCheckIns = () => db.checkins.orderBy('timestamp').reverse().toArray()

/** Subscribe a component to a Dexie query; re-renders whenever the data changes. */
export function useLiveQuery<T>(query: () => Promise<T>): T | undefined {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: console.error })
    return () => sub.unsubscribe()
  }, [query])
  return value
}

export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Ask the browser not to evict our data. Safe to call repeatedly. */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
