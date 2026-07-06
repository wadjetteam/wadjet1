import { createContext, useContext, useState, type ReactNode } from 'react'

interface ThemeContextValue {
  darkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('wadjet-theme') !== 'light' } catch { return true }
  })

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev
      try { localStorage.setItem('wadjet-theme', next ? 'dark' : 'light') } catch {}
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
