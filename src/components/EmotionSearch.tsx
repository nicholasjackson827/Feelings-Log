import { useMemo } from 'react'
import { ALL_PATHS, coreStyle, formatPath, leaf, pathKey, type EmotionPath } from '../data/feelWheel'
import { CheckIcon, CloseIcon, SearchIcon } from './Icons'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  selectedKeys: ReadonlySet<string>
  onPick: (path: EmotionPath) => void
}

export function SearchField({ query, onQueryChange }: Pick<Props, 'query' | 'onQueryChange'>) {
  return (
    <div className="search">
      <div className="search-box">
        <SearchIcon />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Search feelings"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search feelings"
        />
        {query && (
          <button type="button" className="search-clear" onClick={() => onQueryChange('')} aria-label="Clear search">
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  )
}

/** Results across all three levels, each shown with its full path. */
export function SearchResults({ query, selectedKeys, onPick }: Omit<Props, 'onQueryChange'>) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const rank = (word: string) => {
      const w = word.toLowerCase()
      if (w.startsWith(q)) return 0
      if (w.split(' ').some((part) => part.startsWith(q))) return 1
      return w.includes(q) ? 2 : -1
    }
    return ALL_PATHS.map((path, order) => ({ path, order, score: rank(leaf(path)) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score || a.order - b.order)
      .map((r) => r.path)
  }, [query])

  if (results.length === 0) return <p className="empty">No feelings match “{query.trim()}”.</p>

  return (
    <ul className="search-results">
      {results.map((path) => {
        const key = pathKey(path)
        const isSelected = selectedKeys.has(key)
        return (
          <li key={key}>
            <button
              type="button"
              className="search-result"
              style={coreStyle(path[0])}
              aria-pressed={isSelected}
              onClick={() => onPick(path)}
            >
              <span className="dot" />
              <span className="search-result-word">{leaf(path)}</span>
              <span className="search-result-path">{formatPath(path)}</span>
              {isSelected && <CheckIcon />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
