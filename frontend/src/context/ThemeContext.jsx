import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('feeder_theme') || 'dark')
  const [backgroundUrl, setBackgroundUrlState] = useState(
    () => localStorage.getItem('feeder_bg') || '',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('feeder_theme', theme)
  }, [theme])

  useEffect(() => {
    if (backgroundUrl) {
      document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url("${backgroundUrl}")`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundAttachment = 'fixed'
      document.body.style.backgroundPosition = 'center'
    } else {
      document.body.style.backgroundImage = ''
    }
    localStorage.setItem('feeder_bg', backgroundUrl || '')
  }, [backgroundUrl])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const setBackgroundUrl = useCallback((url) => setBackgroundUrlState(url), [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, backgroundUrl, setBackgroundUrl }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
