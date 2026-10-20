import { FEEL_WHEEL, coreStyle, isAncestor, pathKey, type EmotionPath } from '../data/feelWheel'
import type { LoggedEmotion } from '../types'
import { CheckIcon, ChevronIcon } from './Icons'

interface Props {
  selected: LoggedEmotion[]
  expanded: ReadonlySet<string>
  onTap: (path: EmotionPath) => void
}

/**
 * The Feel Wheel as an accordion. Cores are stacked full-width; an open core
 * shows its middle words as a wrapped grid, and an open middle word shows its
 * outer words in a full-width row directly beneath it (via grid dense packing).
 */
export function EmotionWheel({ selected, expanded, onTap }: Props) {
  const selectedKeys = new Set(selected.map((s) => pathKey(s.path)))

  const word = (path: EmotionPath, level: 'core' | 'middle' | 'outer') => {
    const key = pathKey(path)
    const isSelected = selectedKeys.has(key)
    const isOpen = expanded.has(key)
    const below = isSelected ? 0 : selected.filter((s) => isAncestor(path, s.path)).length
    return (
      <button
        key={key}
        type="button"
        className={`word word--${level}`}
        aria-pressed={isSelected}
        aria-expanded={level === 'outer' ? undefined : isOpen}
        onClick={() => onTap(path)}
      >
        {isSelected && <CheckIcon />}
        <span className="word-label">{path[path.length - 1]}</span>
        {below > 0 && (
          <span className="word-badge" aria-label={`${below} selected inside`}>
            {below}
          </span>
        )}
        {level === 'core' && <ChevronIcon />}
      </button>
    )
  }

  return (
    <div className="wheel">
      {FEEL_WHEEL.map((core) => {
        const corePath = [core.name]
        const coreOpen = expanded.has(core.name)
        return (
          <section key={core.name} className={`core${coreOpen ? ' is-open' : ''}`} style={coreStyle(core.name)}>
            {word(corePath, 'core')}
            {coreOpen && (
              <div className="middles">
                {core.children.flatMap((middle) => {
                  const middlePath = [core.name, middle.name]
                  const items = [word(middlePath, 'middle')]
                  if (expanded.has(pathKey(middlePath))) {
                    items.push(
                      <div key={pathKey(middlePath) + '#outers'} className="outers" role="group" aria-label={middle.name}>
                        {middle.children.map((outer) => word([...middlePath, outer], 'outer'))}
                      </div>,
                    )
                  }
                  return items
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
