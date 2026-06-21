import React, { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext(null)
export const useSettings = () => useContext(SettingsContext)

const load = (key, def) => {
  const v = localStorage.getItem(key)
  return v === null ? def : v
}

export function SettingsProvider({ children }) {
  const [miniShape, setMiniShape] = useState(() => load('hailu-mini-shape', 'rect')) // 'rect' | 'square'
  const [bgAnim, setBgAnim] = useState(() => load('hailu-bganim', '1') === '1')

  useEffect(() => { localStorage.setItem('hailu-mini-shape', miniShape) }, [miniShape])
  useEffect(() => { localStorage.setItem('hailu-bganim', bgAnim ? '1' : '0') }, [bgAnim])

  return (
    <SettingsContext.Provider value={{ miniShape, setMiniShape, bgAnim, setBgAnim }}>
      {children}
    </SettingsContext.Provider>
  )
}
