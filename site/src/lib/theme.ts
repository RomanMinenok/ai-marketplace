export type Theme = 'dark' | 'light'

const KEY = 'marketplace-theme'

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function storeTheme(theme: Theme) {
  localStorage.setItem(KEY, theme)
}
