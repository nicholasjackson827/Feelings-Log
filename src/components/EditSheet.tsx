import { useEffect } from 'react'
import { db } from '../db'
import type { CheckIn } from '../types'
import { CheckInEditor, type CheckInDraft } from './CheckInEditor'

interface Props {
  checkIn: CheckIn
  onClose: () => void
  onToast: (message: string) => void
}

export function EditSheet({ checkIn, onClose, onToast }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async ({ note, ...draft }: CheckInDraft) => {
    const updated: CheckIn = { ...checkIn, ...draft, updatedAt: new Date().toISOString() }
    if (note) updated.note = note
    else delete updated.note
    await db.checkins.put(updated)
    onToast('Changes saved')
    onClose()
  }

  const remove = async () => {
    if (!window.confirm('Delete this check-in? This can’t be undone.')) return
    await db.checkins.delete(checkIn.id)
    onToast('Check-in deleted')
    onClose()
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <header className="sheet-header">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <h2 id="edit-title">Edit check-in</h2>
        <button type="button" className="btn btn--ghost btn--danger" onClick={remove}>
          Delete
        </button>
      </header>
      <CheckInEditor initial={checkIn} saveLabel="Save changes" onSave={save} />
    </div>
  )
}
