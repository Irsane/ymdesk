import React, { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import { useSettings } from './settings.jsx'
import Background from './components/Background.jsx'
import SnowOverlay from './components/SnowOverlay.jsx'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import PlayerBar from './components/PlayerBar.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import Home from './views/Home.jsx'
import Search from './views/Search.jsx'
import Liked from './views/Liked.jsx'
import Playlist from './views/Playlist.jsx'

export default function App() {
  const [token, setToken] = useState(undefined) // undefined = ещё проверяем
  const [account, setAccount] = useState(null)
  const [view, setView] = useState({ name: 'home' })
  const [mini, setMini] = useState(false)
  const { miniSize } = useSettings()

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
    await api.logout(); setToken(null); setAccount(null); setView({ name: 'home' })
  }, [])

  const enterMini = useCallback(async () => { await api.setMini(true, miniSize); setMini(true) }, [miniSize])
  const exitMini = useCallback(async () => { await api.setMini(false); setMini(false) }, [])

  if (token === undefined) {
    return <><Background /><div className="boot"><div className="spinner" /></div></>
  }
  if (!token) {
    return <><Background /><SnowOverlay /><Login onLogin={onLogin} /></>
  }
  if (mini) {
    return <MiniPlayer onRestore={exitMini} />
  }

  return (
    <div className="app">
      <Background />
      <SnowOverlay />
      <div className="app-body">
        <Sidebar view={view} setView={setView} account={account} onLogout={onLogout} />
        <main className="content">
          {view.name === 'home' && <Home setView={setView} />}
          {view.name === 'search' && <Search />}
          {view.name === 'liked' && <Liked />}
          {view.name === 'playlist' && <Playlist info={view.playlist} />}
        </main>
      </div>
      <PlayerBar onMini={enterMini} />
    </div>
  )
}
