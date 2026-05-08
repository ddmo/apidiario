export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'apidiario-theme'

function getStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(): void {
  const mode = getStoredMode()
  const theme = getEffectiveTheme(mode)
  document.documentElement.setAttribute('data-theme', theme)
}

export function setThemeMode(mode: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode)
  applyTheme()
}

export function getThemeMode(): ThemeMode {
  return getStoredMode()
}

export function getCurrentTheme(): 'light' | 'dark' {
  return getEffectiveTheme(getStoredMode())
}

// Listen for system preference changes only when in 'system' mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredMode() === 'system') applyTheme()
  })
}
