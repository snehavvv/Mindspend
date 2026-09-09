import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

/* ─── Types ───────────────────────────────────────────────────────────── */
export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

/* ─── Context ─────────────────────────────────────────────────────────── */
const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'finlytics-theme'

/**
 * Read initial theme synchronously so there's zero flicker.
 * The inline <script> in index.html already applied the class to <html>;
 * this just keeps React state in sync with that.
 */
function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/* ─── Provider ────────────────────────────────────────────────────────── */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from storage synchronously — avoids a state update after mount
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const isFirstRender = useRef(true)

  /* Apply theme class to <html> and persist to localStorage */
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  /* Enable CSS color transitions only AFTER the first paint.
     This prevents a jarring flash when the page first loads.             */
  useEffect(() => {
    if (!isFirstRender.current) return
    isFirstRender.current = false

    const raf = requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-ready')
    })

    return () => cancelAnimationFrame(raf)
  }, [])

  /* Listen for OS-level preference changes while the tab is open */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      // Only follow OS preference if user hasn't explicitly set a theme
      if (!localStorage.getItem(STORAGE_KEY)) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggleTheme = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/* ─── Hook ────────────────────────────────────────────────────────────── */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
