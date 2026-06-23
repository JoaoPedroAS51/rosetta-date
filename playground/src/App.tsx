import type { Theme } from './theme'
import { useEffect, useState } from 'react'
import { Converter } from './Converter'
import { applyTheme, getStoredTheme, storeTheme } from './theme'
import './converter.css'

function MonitorIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function SunIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

const THEMES: readonly { id: Theme, label: string, icon: React.JSX.Element }[] = [
  { id: 'system', label: 'System theme', icon: <MonitorIcon /> },
  { id: 'light', label: 'Light theme', icon: <SunIcon /> },
  { id: 'dark', label: 'Dark theme', icon: <MoonIcon /> },
]

export function App(): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    storeTheme(theme)
    if (theme !== 'system')
      return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return (
    <div className="app">
      <header className="app-bar">
        <div className="app-bar-inner">
          <span className="app-brand">
            rosetta-date
            {' '}
            <span>playground</span>
          </span>
          <div className="app-bar-right">
            <div className="app-theme" role="group" aria-label="Theme">
              {THEMES.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className="app-theme-btn"
                  aria-pressed={theme === option.id}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setTheme(option.id)}
                >
                  {option.icon}
                </button>
              ))}
            </div>
            <a className="app-link" href="https://github.com/JoaoPedroAS51/rosetta-date">GitHub</a>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Converter syncUrl />
      </main>
    </div>
  )
}
