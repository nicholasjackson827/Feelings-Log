import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { GearIcon, ListIcon, PlusCircleIcon } from './components/Icons'
import { HistoryScreen } from './screens/HistoryScreen'
import { LogScreen } from './screens/LogScreen'
import { SettingsScreen } from './screens/SettingsScreen'

type Tab = 'log' | 'history' | 'settings'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'log', label: 'Log', icon: <PlusCircleIcon /> },
  { id: 'history', label: 'History', icon: <ListIcon /> },
  { id: 'settings', label: 'Settings', icon: <GearIcon /> },
]

export default function App() {
  // Plain tab state instead of a router, so nothing breaks on GitHub Pages.
  const [tab, setTab] = useState<Tab>('log')
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const timer = useRef<number>(undefined)

  const showToast = useCallback((message: string) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), message })
    timer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div className="app">
      {/* Log stays mounted so an in-progress check-in survives tab switches. */}
      <main className="screen" hidden={tab !== 'log'}>
        <LogScreen onSaved={() => showToast('Saved ✓')} />
      </main>
      {tab === 'history' && (
        <main className="screen">
          <HistoryScreen onToast={showToast} />
        </main>
      )}
      {tab === 'settings' && (
        <main className="screen">
          <SettingsScreen onToast={showToast} />
        </main>
      )}

      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div key={toast.id} className="toast" role="status">
          {toast.message}
        </div>
      )}
    </div>
  )
}
