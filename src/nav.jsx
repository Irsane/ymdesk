import React, { createContext, useContext } from 'react'

// Простой контекст навигации: даёт глубоко вложенным компонентам
// (списку треков, плееру) возможность открыть страницу артиста/альбома.
const NavContext = createContext(() => {})
export const useNav = () => useContext(NavContext)

export function NavProvider({ navigate, children }) {
  return <NavContext.Provider value={navigate}>{children}</NavContext.Provider>
}
