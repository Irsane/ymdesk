import React, { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import { useSettings } from './settings.jsx'
import { NavProvider } from './nav.jsx'
import Background from './components/Background.jsx'
import ParticleOverlay from './components/ParticleOverlay.jsx'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import PlayerBar from './components/PlayerBar.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import Home from './views/Home.jsx'
import Search from './views/Search.jsx'
import Liked from './views/Liked.jsx'
import Playlist from './views/Playlist.jsx'
import Artist from './views/Artist.jsx'
import Album from './views/Album.jsx'

const TOP_LEVEL = ['home', 'search', 'liked']

export default function App() {
  const [token, setToken] = useState(undefined) // undefined = ещё проверяем
  const [account, setAccount] = useState(null)
  const [stack, setStack] = useState([{ name: 'home' }])
  const [mini, setMini] = useState(false)
  const { miniShape } = useSettings()

  const view = stack[stack.length - 1]
  // Навигация со стеком истории: верхний уровень сбрасывает стек,
  // подстраницы (артист/альбом/плейлист) кладутся поверх — для кнопки «назад».
  const navigate = useCallback((v) => {
    setStack(s => {
      if (TOP_LEVEL.includes(v.name)) return [v]
      if (s[s.length - 1]?.name === v.name && JSON.stringify(s[s.length - 1]) === JSON.stringify(v)) return s
      return [...s, v]
    })
  }, [])
  const goBack = useCallback(() => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)), [])
  const setView = navigate

  useEffect(() => {
    (async () => {
      const t = await api.getToken()
      if (t) {
        try { setAccount(await api.account()); setToken(t) }
        catch { setToken(null) }
      } else {
        setToken(null)
      }
    })()
  }, [])

  const onLogin = useCallback((status, t) => { setAccount(status); setToken(t) }, [])

  const onLogout = useCallback(async () => {
    await api.logout(); setToken(null); setAccount(null); setStack([{ name: 'home' }])
  }, [])

  const enterMini = useCallback(async () => { await api.setMini(true, miniShape); setMini(true) }, [miniShape])
  const exitMini = useCallback(async () => { await api.setMini(false); setMini(false) }, [])

  if (token === undefined) {
    return <><Background /><div className="boot"><div className="spinner" /></div></>
  }
  if (!token) {
    return <><Background /><ParticleOverlay /><Login onLogin={onLogin} /></>
  }
  if (mini) {
    return <MiniPlayer shape={miniShape} onRestore={exitMini} />
  }

  return (
    <NavProvider navigate={navigate}>
      <div className="app">
        <Background />
        <ParticleOverlay />
        <div className="app-body">
          <Sidebar view={view} setView={setView} account={account} onLogout={onLogout} />
          <main className="content">
            <TopBar view={view} setView={setView} goBack={goBack} canBack={stack.length > 1} />
            <div className="content-scroll">
              {view.name === 'home' && <Home setView={setView} />}
              {view.name === 'search' && <Search query={view.q || ''} />}
              {view.name === 'liked' && <Liked />}
              {view.name === 'playlist' && <Playlist info={view.playlist} />}
              {view.name === 'artist' && <Artist key={view.artistId} info={view} setView={setView} />}
              {view.name === 'album' && <Album key={view.album?.id} info={view} />}
            </div>
          </main>
        </div>
        <PlayerBar onMini={enterMini} />
      </div>
    </NavProvider>
  )
}
