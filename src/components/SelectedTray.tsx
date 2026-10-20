import { coreStyle, leaf, pathKey, type EmotionPath } from '../data/feelWheel'
import type { LoggedEmotion } from '../types'
import { CloseIcon } from './Icons'

interface Props {
  selected: LoggedEmotion[]
  onIntensity: (path: EmotionPath, intensity: number) => void
  onRemove: (path: EmotionPath) => void
}

export function SelectedTray({ selected, onIntensity, onRemove }: Props) {
  if (selected.length === 0) return <p className="tray-hint">Tap every feeling that fits. Pick as many as you like.</p>

  return (
    <ul className="tray" aria-label="Selected feelings">
      {selected.map(({ path, intensity }) => {
        const name = leaf(path)
        return (
          <li key={pathKey(path)} className="chip" style={coreStyle(path[0])}>
            <span className="chip-label">
              {path.length > 1 && <span className="chip-path">{path.slice(0, -1).join(' › ')}</span>}
              <span className="chip-word">{name}</span>
            </span>
            <span className="intensity" role="radiogroup" aria-label={`${name} intensity`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={n === intensity}
                  className={n <= intensity ? 'is-filled' : undefined}
                  onClick={() => onIntensity(path, n)}
                >
                  {n}
                </button>
              ))}
            </span>
            <button type="button" className="chip-remove" onClick={() => onRemove(path)} aria-label={`Remove ${name}`}>
              <CloseIcon />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
