import { useEffect, useRef, useState } from 'react'
import { allCheckIns, db, requestPersistence, useLiveQuery } from '../db'
import { exportFilename, importJSON, shareOrDownload, toCSV, toJSON } from '../lib/exportImport'
import { getThemePref, setThemePref, type ThemePref } from '../theme'

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function SettingsScreen({ onToast }: { onToast: (message: string) => void }) {
  const [theme, setTheme] = useState(getThemePref)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  // Loaded up front so export can call navigator.share() synchronously within
  // the tap; iOS rejects share() when it follows an async database read.
  const checkins = useLiveQuery(allCheckIns)
  const count = checkins?.length ?? 0

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(false))
  }, [])

  const chooseTheme = (value: ThemePref) => {
    setTheme(value)
    setThemePref(value)
  }

  const exportAs = (kind: 'json' | 'csv') => {
    if (!checkins || checkins.length === 0) return onToast('Nothing to export yet')
    const content = kind === 'json' ? toJSON(checkins) : toCSV(checkins)
    shareOrDownload(exportFilename(kind), content, kind === 'json' ? 'application/json' : 'text/csv').catch((err) =>
      onToast(`Export failed: ${err instanceof Error ? err.message : err}`),
    )
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const r = await importJSON(await file.text())
      const parts = [`${r.added} added`, `${r.updated} updated`, `${r.unchanged} already here`]
      if (r.invalid) parts.push(`${r.invalid} skipped (invalid)`)
      onToast(`Import done: ${parts.join(', ')}`)
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const clearAll = async () => {
    if (!window.confirm(`Delete all ${count} check-ins from this device?`)) return
    if (!window.confirm('Are you absolutely sure? This cannot be undone. Export a backup first if you might want this data.'))
      return
    await db.checkins.clear()
    onToast('All data cleared')
  }

  const askPersist = async () => setPersisted(await requestPersistence())

  return (
    <div className="page">
      <h1 className="screen-title">Settings</h1>

      <section className="card">
        <h2>Appearance</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              onClick={() => chooseTheme(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Your data</h2>
        <p className="notice">
          Your check-ins live <strong>only on this device</strong>. There’s no account and no cloud sync. Deleting the
          app or clearing Safari data erases them, so export regularly. Exports are your backup.
        </p>
        <p className="muted">
          {count} check-in{count === 1 ? '' : 's'} stored.{' '}
          {persisted === true && 'Persistent storage is on.'}
          {persisted === false && (
            <>
              Persistent storage isn’t granted yet.{' '}
              <button type="button" className="link" onClick={askPersist}>
                Request it
              </button>
            </>
          )}
        </p>

        <div className="button-stack">
          <button type="button" className="btn btn--secondary btn--block" onClick={() => exportAs('json')}>
            Export JSON (full backup)
          </button>
          <button type="button" className="btn btn--secondary btn--block" onClick={() => exportAs('csv')}>
            Export CSV (spreadsheet)
          </button>
          <label className={`btn btn--secondary btn--block${busy ? ' is-disabled' : ''}`}>
            {busy ? 'Importing…' : 'Import JSON backup'}
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="visually-hidden"
              disabled={busy}
              onChange={(e) => onImportFile(e.target.files?.[0])}
            />
          </label>
          <p className="muted small">Import merges by check-in id, so nothing gets duplicated.</p>
        </div>
      </section>

      <section className="card">
        <h2>Danger zone</h2>
        <button type="button" className="btn btn--danger-solid btn--block" onClick={clearAll} disabled={count === 0}>
          Clear all data
        </button>
      </section>

      <p className="muted small center">Feelings Log · emotions from Geoffrey Roberts’ Feel Wheel</p>
    </div>
  )
}
