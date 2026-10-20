import { db } from '../db'
import { isValidPath } from '../data/feelWheel'
import type { CheckIn, LoggedEmotion } from '../types'

export const EXPORT_FORMAT = 'feelings-log'
export const EXPORT_VERSION = 1

const today = () => new Date().toISOString().slice(0, 10)

export function exportFilename(ext: 'json' | 'csv') {
  return `feelings-log-${today()}.${ext}`
}

export function toJSON(checkins: CheckIn[]): string {
  return JSON.stringify(
    { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), checkins },
    null,
    2,
  )
}

function csvCell(value: string | number | undefined): string {
  const s = value === undefined ? '' : String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** One row per emotion. */
export function toCSV(checkins: CheckIn[]): string {
  const rows = [['checkin_id', 'timestamp', 'core', 'middle', 'outer', 'intensity', 'note']]
  for (const c of checkins) {
    for (const e of c.emotions) {
      rows.push([c.id, c.timestamp, e.path[0], e.path[1] ?? '', e.path[2] ?? '', String(e.intensity), c.note ?? ''])
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

/**
 * Hand a file to the user. On touch devices with Web Share (iOS Safari) this
 * opens the share sheet so it can go to Files, Mail, etc.; otherwise it downloads.
 */
export async function shareOrDownload(filename: string, content: string, mime: string): Promise<void> {
  const file = new File([content], filename, { type: mime })
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return
      // Fall through to a regular download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function parseEmotion(raw: unknown): LoggedEmotion | null {
  if (!raw || typeof raw !== 'object') return null
  const { path, intensity } = raw as Record<string, unknown>
  if (!isValidPath(path)) return null
  if (typeof intensity !== 'number' || !Number.isInteger(intensity) || intensity < 1 || intensity > 5) return null
  return { path: [...path], intensity }
}

const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

function parseCheckIn(raw: unknown): CheckIn | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id || !isDate(r.timestamp) || !Array.isArray(r.emotions)) return null
  const emotions = r.emotions.map(parseEmotion)
  if (emotions.length === 0 || emotions.some((e) => e === null)) return null
  const createdAt = isDate(r.createdAt) ? r.createdAt : r.timestamp
  const updatedAt = isDate(r.updatedAt) ? r.updatedAt : createdAt
  const note = typeof r.note === 'string' && r.note.trim() ? r.note : undefined
  return { id: r.id, timestamp: r.timestamp, emotions: emotions as LoggedEmotion[], note, createdAt, updatedAt }
}

export interface ImportResult {
  added: number
  updated: number
  unchanged: number
  invalid: number
}

/** Merge a JSON export into the database by id. Existing entries are only replaced by newer versions. */
export async function importJSON(text: string): Promise<ImportResult> {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  const list = Array.isArray(data) ? data : (data as { checkins?: unknown })?.checkins
  if (!Array.isArray(list)) throw new Error("That doesn't look like a Feelings Log export.")

  const parsed = list.map(parseCheckIn)
  const valid = parsed.filter((c): c is CheckIn => c !== null)
  const newer = (a: CheckIn, b: CheckIn) => Date.parse(a.updatedAt) > Date.parse(b.updatedAt)

  // The file itself might repeat an id; keep its most recent version.
  const byId = new Map<string, CheckIn>()
  for (const c of valid) {
    const prev = byId.get(c.id)
    if (!prev || newer(c, prev)) byId.set(c.id, c)
  }
  const unique = [...byId.values()]

  const result: ImportResult = {
    added: 0,
    updated: 0,
    unchanged: valid.length - unique.length,
    invalid: parsed.length - valid.length,
  }

  await db.transaction('rw', db.checkins, async () => {
    const existing = await db.checkins.bulkGet(unique.map((c) => c.id))
    const toPut: CheckIn[] = []
    unique.forEach((incoming, i) => {
      const current = existing[i]
      if (!current) {
        result.added++
        toPut.push(incoming)
      } else if (newer(incoming, current)) {
        result.updated++
        toPut.push(incoming)
      } else {
        result.unchanged++
      }
    })
    await db.checkins.bulkPut(toPut)
  })
  return result
}
