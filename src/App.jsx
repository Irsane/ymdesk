import React, { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import Background from './components/Background.jsx'
import SnowOverlay from './components/SnowOverlay.jsx'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import PlayerBar from './components/PlayerBar.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import ConnectVk from './components/ConnectVk.jsx'
import Home from './views/Home.jsx'
import Search from './views/Search.jsx'
import Liked from './views/Liked.jsx'
import Playlist from './views/Playlist.jsx'

export default function App() {
  const [token, setToken] = useState(undefined) // undefined = ещё проверяем
  const [account, setAccount] = useState(null)
  const [vkAccount, setVkAccount] = useState(null)
  const [source, setSource] = useState('ya')      // 'ya' | 'vk'
  const [view, setView] = useState({ name: 'home' })
  const [mini, setMini] = useState(false)
  const [vkModal, setVkModal] = useState(false)

  // При старте читаем токены Яндекса и VK.
  useEffect(() => {
    (async () => {
      const [t, vt] = await Promise.all([api.getToken(), api.vkGetToken()])
      let vkOk = false
      if (vt) {
        try { const p = await api.vkGetProfile(); setVkAccount(p); vkOk = !!p } catch { /* ignore */ }
      }
      if (t) {
        try { setAccount(await api.account()); setToken(t) } catch { setToken(null) }
      } else {
        setToken(null)
        if (vkOk) setSource('vk') // только VK — стартуем с него
      }
    })()
  }, [])

  const onLogin = useCallback((status, t) => { setAccount(status); setToken(t); setSource('ya') }, [])
  const onVk = useCallback((profile) => { setVkAccount(profile); setSource('vk') }, [])

  const onLogout = useCallback(async () => {
    // Выход из текущего источника.
    if (source === 'vk') {
      await api.vkLogout(); setVkAccount(null); setSource('ya'); setView({ name: 'home' })
      return
    }
    await api.logout(); setToken(null); setAccount(null); setView({ name: 'home' })
  }, [source])

  const onVkConnected = useCallback((profile) => {
    setVkAccount(profile); setSource('vk'); setVkModal(false); setView({ name: 'home' })
  }, [])

  const switchSource = useCallback((s) => {
    if (s === 'vk' && !vkAccount) { setVkModal(true); return }
    setSource(s); setView({ name: 'home' })
  }, [vkAccount])

  const enterMini = useCallback(async () => { await api.setMini(true); setMini(true) }, [])
  const exitMini = useCallback(async () => { await api.setMini(false); setMini(false) }, [])

  if (token === undefined) {
    return <><Background /><div className="boot"><div className="spinner" /></div></>
  }
  if (!token && !vkAccount) {
    return <><Background /><SnowOverlay /><Login onLogin={onLogin} onVk={onVk} /></>
  }
  if (mini) {
    return <MiniPlayer onRestore={exitMini} />
  }

  return (
    <div className="app">
      <Background />
      <SnowOverlay />
      <div className="app-body">
        <Sidebar
          view={view} setView={setView}
          account={account} vkAccount={vkAccount}
          source={source} switchSource={switchSource}
          onLogout={onLogout}
        />
        <main className="content">
          {view.name === 'home' && <Home source={source} setView={setView} />}
          {view.name === 'search' && <Search source={source} />}
          {view.name === 'liked' && <Liked source={source} />}
          {view.name === 'playlist' && <Playlist info={view.playlist} />}
        </main>
      </div>
      <PlayerBar onMini={enterMini} />
      {vkModal && <ConnectVk onClose={() => setVkModal(false)} onConnected={onVkConnected} />}
    </div>
  )
}
