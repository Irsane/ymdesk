import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import Logo, { Wordmark } from './Logo.jsx'
import { IconHome, IconSearch, IconHeart } from './Icons.jsx'

const NAV = [
  { name: 'home', label: 'Главная', Icon: IconHome },
  { name: 'search', label: 'Поиск', Icon: IconSearch },
  { name: 'liked', label: 'Мне нравится', Icon: IconHeart }
]

export default function Sidebar({ view, setView, account, onLogout }) {
  const [playlists, setPlaylists] = useState([])

  useEffect(() => {
    api.playlists().then(setPlaylists).catch(() => {})
  }, [])

  const name = account?.account?.fullName || account?.account?.login || 'Пользователь'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo size={34} animated /> <Wordmark size={22} />
      </div>

      <nav className="nav">
        {NAV.map(item => (
          <button
            key={item.name}
            className={`nav-item ${view.name === item.name ? 'active' : ''}`}
            onClick={() => setView({ name: item.name })}
          >
            <span className="nav-icon"><item.Icon size={20} /></span> {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-section">Плейлисты</div>
      <div className="playlist-list">
        {playlists.map(pl => (
          <button
            key={pl.kind}
            className={`playlist-link ${view.name === 'playlist' && view.playlist?.kind === pl.kind ? 'active' : ''}`}
            onClick={() => setView({ name: 'playlist', playlist: pl })}
            title={pl.title}
          >
            {pl.title}
          </button>
        ))}
        {!playlists.length && <div className="muted small">Нет плейлистов</div>}
      </div>

      <div className="sidebar-footer">
        <div className="user">
          <div className="avatar">{name[0]?.toUpperCase()}</div>
          <div className="user-name" title={name}>{name}</div>
        </div>
        <button className="btn-ghost" onClick={onLogout}>Выйти</button>
      </div>
    </aside>
  )
}
