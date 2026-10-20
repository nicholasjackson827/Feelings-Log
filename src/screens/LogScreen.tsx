import { useState } from 'react'
import { CheckInEditor, type CheckInDraft } from '../components/CheckInEditor'
import { db, newId } from '../db'

export function LogScreen({ onSaved }: { onSaved: () => void }) {
  // Bumping the key remounts the editor: clears selection, note, time and collapses the wheel.
  const [formKey, setFormKey] = useState(0)

  const save = async (draft: CheckInDraft) => {
    const now = new Date().toISOString()
    await db.checkins.add({ id: newId(), ...draft, createdAt: now, updatedAt: now })
    setFormKey((k) => k + 1)
    onSaved()
  }

  return (
    <CheckInEditor
      key={formKey}
      title={<h1 className="screen-title">How are you feeling?</h1>}
      onSave={save}
    />
  )
}
