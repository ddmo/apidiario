export type ThemeMode = 'light' | 'dark' | 'system'
export type PaletteId = 'classico' | 'miele-notturno' | 'prato-fiorito' | 'terracotta-mediterranea' | 'ambra-contemporanea'

const STORAGE_KEY = 'apidiario-theme'
const PALETTE_STORAGE_KEY = 'apidiario-palette'
const PALETTE_IDS: PaletteId[] = ['classico', 'miele-notturno', 'prato-fiorito', 'terracotta-mediterranea', 'ambra-contemporanea']

function getStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function getStoredPalette(): PaletteId {
  const stored = localStorage.getItem(PALETTE_STORAGE_KEY)
  if (stored && (PALETTE_IDS as string[]).includes(stored)) return stored as PaletteId
  return 'classico'
}

function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(): void {
  const mode = getStoredMode()
  const theme = getEffectiveTheme(mode)
  document.documentElement.setAttribute('data-theme', theme)

  const palette = getStoredPalette()
  if (palette === 'classico') {
    document.documentElement.removeAttribute('data-palette')
  } else {
    document.documentElement.setAttribute('data-palette', palette)
  }
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

export function setPalette(palette: PaletteId): void {
  localStorage.setItem(PALETTE_STORAGE_KEY, palette)
  applyTheme()
}

export function getPalette(): PaletteId {
  return getStoredPalette()
}

// Listen for system preference changes only when in 'system' mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredMode() === 'system') applyTheme()
  })
}
