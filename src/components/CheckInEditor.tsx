import { useRef, useState, type ReactNode } from 'react'
import { pathKey, type EmotionPath } from '../data/feelWheel'
import { formatWhen, toLocalInput } from '../lib/format'
import { initialPickerState, removeSelected, setIntensity, tapWord } from '../lib/selection'
import type { CheckIn, LoggedEmotion } from '../types'
import { EmotionWheel } from './EmotionWheel'
import { SearchField, SearchResults } from './EmotionSearch'
import { ClockIcon, NoteIcon } from './Icons'
import { SelectedTray } from './SelectedTray'

export interface CheckInDraft {
  timestamp: string
  emotions: LoggedEmotion[]
  note?: string
}

interface Props {
  /** Existing check-in to edit; omit for a new one. */
  initial?: CheckIn
  title?: ReactNode
  saveLabel?: string
  onSave: (draft: CheckInDraft) => Promise<void> | void
}

/**
 * Emotion picker + selected tray + note/time + Save. Used for both new
 * check-ins (Log tab) and editing (History). Reset it by changing its `key`.
 */
export function CheckInEditor({ initial, title, saveLabel = 'Save', onSave }: Props) {
  const [picker, setPicker] = useState(() => initialPickerState(initial?.emotions))
  const [query, setQuery] = useState('')
  const [note, setNote] = useState(initial?.note ?? '')
  const [noteOpen, setNoteOpen] = useState(Boolean(initial?.note))
  // null = "now" (resolved at save time); otherwise a datetime-local string.
  const [initialTime] = useState(() => (initial ? toLocalInput(new Date(initial.timestamp)) : null))
  const [time, setTime] = useState(initialTime)
  const [timeOpen, setTimeOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const { selected, expanded } = picker
  const selectedKeys = new Set(selected.map((s) => pathKey(s.path)))

  const pickFromSearch = (path: EmotionPath) => {
    setPicker((p) => tapWord(p, path, true))
    setQuery('')
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const toggleNote = () => {
    const open = !noteOpen
    setNoteOpen(open)
    if (open) requestAnimationFrame(() => noteRef.current?.focus())
  }

  const save = async () => {
    if (selected.length === 0 || saving) return
    setSaving(true)
    try {
      const date = time ? new Date(time) : new Date()
      const trimmed = note.trim()
      await onSave({
        // The time input has minute precision; don't let an untouched edit truncate seconds.
        timestamp:
          initial && time === initialTime
            ? initial.timestamp
            : (Number.isNaN(date.getTime()) ? new Date() : date).toISOString(),
        emotions: selected,
        note: trimmed || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="editor">
      <div className="editor-scroll">
        {title}
        <SearchField query={query} onQueryChange={setQuery} />
        {query.trim() ? (
          <SearchResults query={query} selectedKeys={selectedKeys} onPick={pickFromSearch} />
        ) : (
          <EmotionWheel selected={selected} expanded={expanded} onTap={(path) => setPicker((p) => tapWord(p, path))} />
        )}
      </div>

      <div className="editor-footer">
        <SelectedTray
          selected={selected}
          onIntensity={(path, n) => setPicker((p) => setIntensity(p, path, n))}
          onRemove={(path) => setPicker((p) => removeSelected(p, path))}
        />

        {noteOpen && (
          <textarea
            ref={noteRef}
            className="note-input"
            rows={2}
            placeholder="What's going on?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Note"
          />
        )}

        {timeOpen && (
          <div className="time-row">
            <input
              type="datetime-local"
              className="time-input"
              value={time ?? toLocalInput(new Date())}
              max={toLocalInput(new Date())}
              onChange={(e) => setTime(e.target.value || null)}
              aria-label="When"
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setTime(null)
                setTimeOpen(false)
              }}
            >
              Now
            </button>
          </div>
        )}

        <div className="footer-actions">
          <button
            type="button"
            className={`btn btn--secondary${noteOpen || note.trim() ? ' is-active' : ''}`}
            onClick={toggleNote}
            aria-expanded={noteOpen}
          >
            <NoteIcon />
            Note
          </button>
          <button
            type="button"
            className={`btn btn--secondary${time ? ' is-active' : ''}`}
            onClick={() => setTimeOpen((o) => !o)}
            aria-expanded={timeOpen}
          >
            <ClockIcon />
            <span className="time-label">{time ? formatWhen(new Date(time)) : 'Now'}</span>
          </button>
          <button type="button" className="btn btn--primary save" disabled={selected.length === 0 || saving} onClick={save}>
            {saveLabel}
            {selected.length > 0 && <span className="save-count">{selected.length}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
