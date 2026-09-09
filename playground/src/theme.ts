export type Theme = 'system' | 'light' | 'dark'

const KEY = 'rd-theme'

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system')
      return stored
  }
  catch {}
  return 'system'
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  }
  catch {}
}

export function systemPrefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveDark(theme: Theme): boolean {
  return theme === 'dark' || (theme === 'system' && systemPrefersDark())
}

/** Apply the theme to the document root. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', resolveDark(theme))
}
