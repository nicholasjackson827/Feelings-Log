export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'feelings-log:theme'
const COLORS = { light: '#f7f6f3', dark: '#111114' }
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

export function setThemePref(pref: ThemePref) {
  localStorage.setItem(KEY, pref)
  applyTheme()
}

export function applyTheme() {
  const pref = getThemePref()
  const root = document.documentElement
  if (pref === 'system') delete root.dataset.theme
  else root.dataset.theme = pref

  // Keep the browser chrome / status bar in sync with the resolved theme.
  const resolved = pref === 'system' ? (darkQuery.matches ? 'dark' : 'light') : pref
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.removeAttribute('media')
    m.setAttribute('content', COLORS[resolved])
  })
}

darkQuery.addEventListener('change', applyTheme)
