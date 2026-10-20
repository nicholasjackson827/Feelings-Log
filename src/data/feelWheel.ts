import type { CSSProperties } from 'react'

// Geoffrey Roberts' Feel Wheel: Core > Middle > Outer.
// Some words appear in more than one branch, so an emotion is always
// identified by its full path (e.g. ['Sad', 'Hurt', 'Embarrassed']).

export type EmotionPath = string[]

export interface MiddleEmotion {
  name: string
  children: string[]
}

export interface CoreEmotion {
  name: string
  /** Solid color for this core; tints for deeper levels are derived in CSS. */
  color: string
  /** Text color with good contrast on `color`. */
  on: string
  children: MiddleEmotion[]
}

const raw: [name: string, color: string, on: string, middles: [string, string[]][]][] = [
  ['Happy', '#f2b705', '#1d1600', [
    ['Playful', ['Aroused', 'Cheeky']],
    ['Content', ['Free', 'Joyful']],
    ['Interested', ['Curious', 'Inquisitive']],
    ['Proud', ['Successful', 'Confident']],
    ['Accepted', ['Respected', 'Valued']],
    ['Powerful', ['Courageous', 'Creative']],
    ['Peaceful', ['Loving', 'Thankful']],
    ['Trusting', ['Sensitive', 'Intimate']],
    ['Optimistic', ['Hopeful', 'Inspired']],
  ]],
  ['Sad', '#2f6fd6', '#ffffff', [
    ['Lonely', ['Isolated', 'Abandoned']],
    ['Vulnerable', ['Victimized', 'Fragile']],
    ['Despair', ['Grief', 'Powerless']],
    ['Guilty', ['Ashamed', 'Remorseful']],
    ['Depressed', ['Inferior', 'Empty']],
    ['Hurt', ['Embarrassed', 'Disappointed']],
  ]],
  ['Disgusted', '#7c9a2b', '#111a00', [
    ['Disapproving', ['Judgmental', 'Embarrassed']],
    ['Disappointed', ['Appalled', 'Revolted']],
    ['Awful', ['Nauseated', 'Detestable']],
    ['Repelled', ['Horrified', 'Hesitant']],
  ]],
  ['Angry', '#d93f3f', '#ffffff', [
    ['Let Down', ['Betrayed', 'Resentful']],
    ['Humiliated', ['Disrespected', 'Ridiculed']],
    ['Bitter', ['Indignant', 'Violated']],
    ['Mad', ['Furious', 'Jealous']],
    ['Aggressive', ['Provoked', 'Hostile']],
    ['Frustrated', ['Infuriated', 'Annoyed']],
    ['Distant', ['Withdrawn', 'Numb']],
    ['Critical', ['Skeptical', 'Dismissive']],
  ]],
  ['Fearful', '#8b5cd6', '#ffffff', [
    ['Scared', ['Helpless', 'Frightened']],
    ['Anxious', ['Overwhelmed', 'Worried']],
    ['Insecure', ['Inadequate', 'Inferior']],
    ['Weak', ['Worthless', 'Insignificant']],
    ['Rejected', ['Excluded', 'Persecuted']],
    ['Threatened', ['Nervous', 'Exposed']],
  ]],
  ['Bad', '#1a9e8f', '#00201c', [
    ['Bored', ['Indifferent', 'Apathetic']],
    ['Busy', ['Pressured', 'Rushed']],
    ['Stressed', ['Overwhelmed', 'Out of Control']],
    ['Tired', ['Sleepy', 'Unfocused']],
  ]],
  ['Surprised', '#d9488f', '#ffffff', [
    ['Startled', ['Shocked', 'Dismayed']],
    ['Confused', ['Disillusioned', 'Perplexed']],
    ['Amazed', ['Astonished', 'Awe']],
    ['Excited', ['Eager', 'Energetic']],
  ]],
]

export const FEEL_WHEEL: CoreEmotion[] = raw.map(([name, color, on, middles]) => ({
  name,
  color,
  on,
  children: middles.map(([m, outers]) => ({ name: m, children: outers })),
}))

const CORE_BY_NAME = new Map(FEEL_WHEEL.map((c) => [c.name, c]))

export function getCore(name: string): CoreEmotion | undefined {
  return CORE_BY_NAME.get(name)
}

/** Every valid path in the wheel (all three levels), in wheel order. */
export const ALL_PATHS: EmotionPath[] = FEEL_WHEEL.flatMap((core) => [
  [core.name],
  ...core.children.flatMap((m) => [[core.name, m.name], ...m.children.map((o) => [core.name, m.name, o])]),
])

export const pathKey = (path: EmotionPath) => path.join('/')

const VALID_KEYS = new Set(ALL_PATHS.map(pathKey))

export function isValidPath(path: unknown): path is EmotionPath {
  return (
    Array.isArray(path) &&
    path.length >= 1 &&
    path.length <= 3 &&
    path.every((p) => typeof p === 'string') &&
    VALID_KEYS.has(pathKey(path))
  )
}

/** True if `a` is a strict ancestor of `b`. */
export function isAncestor(a: EmotionPath, b: EmotionPath): boolean {
  return a.length < b.length && a.every((w, i) => b[i] === w)
}

export const leaf = (path: EmotionPath) => path[path.length - 1]

export const formatPath = (path: EmotionPath) => path.join(' › ')

/** CSS custom properties that color an element by its core emotion. */
export function coreStyle(coreName: string): CSSProperties {
  const core = getCore(coreName)
  return { '--c': core?.color ?? '#888', '--on': core?.on ?? '#fff' } as CSSProperties
}
