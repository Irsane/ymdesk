import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

// Доступные оформления приложения.
export const THEMES = [
  { id: 'dark', name: 'Тёмная', hint: 'Фиолетовый акцент' },
  { id: 'superdark', name: 'Супер тёмная', hint: 'Чистый чёрный (OLED)' },
  { id: 'light', name: 'Светлая', hint: 'Дневной режим' },
  { id: 'snow', name: 'Снежная', hint: 'Снежинки по всему приложению' }
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('hailu-theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('hailu-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}
