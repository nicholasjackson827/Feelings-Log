import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { requestPersistence } from './db'
import { applyTheme } from './theme'
import './styles.css'

applyTheme()

// Ask Safari not to evict IndexedDB data (no-op once granted).
requestPersistence().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
