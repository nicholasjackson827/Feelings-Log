import { useCallback, useMemo, useState } from 'react'
import { EditSheet } from '../components/EditSheet'
import { coreStyle, formatPath, leaf, pathKey } from '../data/feelWheel'
import { allCheckIns, useLiveQuery } from '../db'
import { dayKey, formatDay, formatTime } from '../lib/format'
import type { CheckIn } from '../types'

export function HistoryScreen({ onToast }: { onToast: (message: string) => void }) {
  const checkins = useLiveQuery(allCheckIns)
  const [editing, setEditing] = useState<CheckIn | null>(null)
  const close = useCallback(() => setEditing(null), [])

  const days = useMemo(() => {
    const groups: { key: string; label: string; items: CheckIn[] }[] = []
    for (const c of checkins ?? []) {
      const date = new Date(c.timestamp)
      const key = dayKey(date)
      if (groups.at(-1)?.key !== key) groups.push({ key, label: formatDay(date), items: [] })
      groups.at(-1)!.items.push(c)
    }
    return groups
  }, [checkins])

  return (
    <div className="page">
      <h1 className="screen-title">History</h1>
      {checkins && checkins.length === 0 && (
        <p className="empty">No check-ins yet. Your logged feelings will show up here.</p>
      )}
      {days.map((day) => (
        <section key={day.key} className="day">
          <h2 className="day-title">{day.label}</h2>
          <ul className="entries">
            {day.items.map((c) => (
              <li key={c.id}>
                <button type="button" className="entry" onClick={() => setEditing(c)}>
                  <time className="entry-time" dateTime={c.timestamp}>
                    {formatTime(new Date(c.timestamp))}
                  </time>
                  <span className="entry-body">
                    <span className="entry-chips">
                      {c.emotions.map((e) => (
                        <span
                          key={pathKey(e.path)}
                          className="mini-chip"
                          style={coreStyle(e.path[0])}
                          title={formatPath(e.path)}
                        >
                          {leaf(e.path)}
                          <span className="mini-chip-intensity" aria-label={`intensity ${e.intensity}`}>
                            {e.intensity}
                          </span>
                        </span>
                      ))}
                    </span>
                    {c.note && <span className="entry-note">{c.note}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {editing && <EditSheet checkIn={editing} onClose={close} onToast={onToast} />}
    </div>
  )
}
