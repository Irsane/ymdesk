import React, { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import Background from './components/Background.jsx'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import PlayerBar from './components/PlayerBar.jsx'
import Home from './views/Home.jsx'
import Search from './views/Search.jsx'
import Liked from './views/Liked.jsx'
import Playlist from './views/Playlist.jsx'

export default function App() {
  const [token, setToken] = useState(undefined) // undefined = ещё проверяем
  const [account, setAccount] = useState(null)
  const [view, setView] = useState({ name: 'home' })

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

  if (token === undefined) {
    return <><Background /><div className="boot"><div className="spinner" /></div></>
  }

  if (!token) {
    return <><Background /><Login onLogin={onLogin} /></>
  }

  return (
    <div className="app">
      <Background />
      <div className="app-body">
        <Sidebar view={view} setView={setView} account={account} onLogout={onLogout} />
        <main className="content">
          {view.name === 'home' && <Home setView={setView} />}
          {view.name === 'search' && <Search setView={setView} />}
          {view.name === 'liked' && <Liked />}
          {view.name === 'playlist' && <Playlist info={view.playlist} />}
        </main>
      </div>
      <PlayerBar />
    </div>
  )
}
