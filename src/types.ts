import type { EmotionPath } from './data/feelWheel'

export interface LoggedEmotion {
  /** 1–3 items: [core] | [core, middle] | [core, middle, outer] */
  path: EmotionPath
  /** 1–5 */
  intensity: number
}

export interface CheckIn {
  id: string
  /** ISO timestamp of when the feelings happened */
  timestamp: string
  emotions: LoggedEmotion[]
  note?: string
  createdAt: string
  updatedAt: string
}
