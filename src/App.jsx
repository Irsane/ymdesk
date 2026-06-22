import React, { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import { useSettings } from './settings.jsx'
import { NavProvider } from './nav.jsx'
import Background from './components/Background.jsx'
import ParticleOverlay from './components/ParticleOverlay.jsx'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import PlayerBar from './components/PlayerBar.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import Home from './views/Home.jsx'
import Search from './views/Search.jsx'
import Liked from './views/Liked.jsx'
import Playlist from './views/Playlist.jsx'
import Artist from './views/Artist.jsx'
import Album from './views/Album.jsx'

export default function App() {
  const [token, setToken] = useState(undefined) // undefined = ещё проверяем
  const [account, setAccount] = useState(null)
  const [view, setView] = useState({ name: 'home' })
  const [mini, setMini] = useState(false)
  const { miniShape } = useSettings()

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
    <NavProvider navigate={setView}>
      <div className="app">
        <Background />
        <ParticleOverlay />
        <div className="app-body">
          <Sidebar view={view} setView={setView} account={account} onLogout={onLogout} />
          <main className="content">
            {view.name === 'home' && <Home setView={setView} />}
            {view.name === 'search' && <Search setView={setView} />}
            {view.name === 'liked' && <Liked />}
            {view.name === 'playlist' && <Playlist info={view.playlist} />}
            {view.name === 'artist' && <Artist key={view.artistId} info={view} setView={setView} />}
            {view.name === 'album' && <Album key={view.album?.id} info={view} />}
          </main>
        </div>
        <PlayerBar onMini={enterMini} />
      </div>
    </NavProvider>
  )
}
