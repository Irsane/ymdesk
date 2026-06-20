import React, { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import Background from './components/Background.jsx'
import SnowOverlay from './components/SnowOverlay.jsx'
import RainOverlay from './components/RainOverlay.jsx'
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

  // При старте читаем сохранённый токен.
  useEffect(() => {
    (async () => {
      const t = await api.getToken()
      if (t) {
        try {
          const status = await api.account()
          setAccount(status)
          setToken(t)
        } catch {
          setToken(null) // токен протух
        }
      } else {
        setToken(null)
      }
    })()
  }, [])

  const onLogin = useCallback((status, t) => {
    setAccount(status)
    setToken(t)
  }, [])

  const onLogout = useCallback(async () => {
    await api.logout()
    setToken(null)
    setAccount(null)
    setView({ name: 'home' })
  }, [])

  const enterMini = useCallback(async () => { await api.setMini(true); setMini(true) }, [])
  const exitMini = useCallback(async () => { await api.setMini(false); setMini(false) }, [])

  if (token === undefined) {
    return <><Background /><div className="boot"><div className="spinner" /></div></>
  }

  if (!token) {
    return <><Background /><SnowOverlay /><RainOverlay /><Login onLogin={onLogin} /></>
  }

  // Мини-режим: только компактный плеер.
  if (mini) {
    return <MiniPlayer onRestore={exitMini} />
  }

  return (
    <div className="app">
      <Background />
      <SnowOverlay />
      <RainOverlay />
      <div className="app-body">
        <Sidebar view={view} setView={setView} account={account} onLogout={onLogout} />
        <main className="content">
          {view.name === 'home' && <Home setView={setView} />}
          {view.name === 'search' && <Search setView={setView} />}
          {view.name === 'liked' && <Liked />}
          {view.name === 'playlist' && <Playlist info={view.playlist} />}
        </main>
      </div>
      <PlayerBar onMini={enterMini} />
    </div>
  )
}
