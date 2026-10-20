import { isAncestor, pathKey, type EmotionPath } from '../data/feelWheel'
import type { LoggedEmotion } from '../types'

export const DEFAULT_INTENSITY = 3

export interface PickerState {
  selected: LoggedEmotion[]
  /** pathKeys of words whose children are currently shown */
  expanded: ReadonlySet<string>
}

export function initialPickerState(selected: LoggedEmotion[] = []): PickerState {
  // When editing, open the branches leading to what's already selected.
  const expanded = new Set<string>()
  for (const s of selected) for (let i = 1; i < s.path.length; i++) expanded.add(pathKey(s.path.slice(0, i)))
  return { selected, expanded }
}

const isSame = (a: EmotionPath, b: EmotionPath) => pathKey(a) === pathKey(b)

function collapse(expanded: ReadonlySet<string>, key: string): Set<string> {
  return new Set([...expanded].filter((k) => k !== key && !k.startsWith(key + '/')))
}

function expandTo(expanded: ReadonlySet<string>, path: EmotionPath, includeSelf: boolean): Set<string> {
  const next = new Set(expanded)
  const end = includeSelf && path.length < 3 ? path.length : path.length - 1
  for (let i = 1; i <= end; i++) next.add(pathKey(path.slice(0, i)))
  return next
}

/**
 * Tap on a word in the wheel (or a search result):
 * - selected word → deselect it and collapse its branch
 * - a descendant is selected → just open/close the branch (more specific wins)
 * - otherwise → select it, replacing any selected ancestor, and open its children
 */
export function tapWord(state: PickerState, path: EmotionPath, fromSearch = false): PickerState {
  const { selected, expanded } = state
  const key = pathKey(path)

  if (selected.some((s) => isSame(s.path, path))) {
    return { selected: selected.filter((s) => !isSame(s.path, path)), expanded: collapse(expanded, key) }
  }

  if (selected.some((s) => isAncestor(path, s.path))) {
    if (fromSearch) return { selected, expanded: expandTo(expanded, path, true) }
    return { selected, expanded: expanded.has(key) ? collapse(expanded, key) : expandTo(expanded, path, true) }
  }

  // Replace a selected ancestor in place (keeping its intensity), otherwise append.
  const ancestor = selected.find((s) => isAncestor(s.path, path))
  const entry: LoggedEmotion = { path, intensity: ancestor?.intensity ?? DEFAULT_INTENSITY }
  const next = ancestor
    ? selected.filter((s) => s === ancestor || !isAncestor(s.path, path)).map((s) => (s === ancestor ? entry : s))
    : [...selected, entry]

  return { selected: next, expanded: expandTo(expanded, path, true) }
}

export function removeSelected(state: PickerState, path: EmotionPath): PickerState {
  return { ...state, selected: state.selected.filter((s) => !isSame(s.path, path)) }
}

export function setIntensity(state: PickerState, path: EmotionPath, intensity: number): PickerState {
  return { ...state, selected: state.selected.map((s) => (isSame(s.path, path) ? { ...s, intensity } : s)) }
}
