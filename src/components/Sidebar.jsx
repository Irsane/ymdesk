import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import Logo, { Wordmark } from './Logo.jsx'
import Settings from './Settings.jsx'
import { IconHome, IconSearch, IconHeart, IconLogout, IconSettings } from './Icons.jsx'

const NAV = [
  { name: 'home', label: 'Главная', Icon: IconHome },
  { name: 'search', label: 'Поиск', Icon: IconSearch },
  { name: 'liked', label: 'Мне нравится', Icon: IconHeart }
]

function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]?.toUpperCase()).join('') || 'U'
}

export default function Sidebar({ view, setView, account, onLogout }) {
  const [playlists, setPlaylists] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    api.playlists().then(setPlaylists).catch(() => {})
  }, [])

  const name = account?.account?.fullName || account?.account?.login || 'Пользователь'
  const sub = account?.account?.login

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo size={34} animated /> <Wordmark size={22} />
      </div>

      <nav className="nav">
        {NAV.map(item => (
          <button key={item.name}
            className={`nav-item ${view.name === item.name ? 'active' : ''}`}
            onClick={() => setView({ name: item.name })}>
            <span className="nav-icon"><item.Icon size={20} /></span> {item.label}
          </button>
        ))}
      </nav>

      {playlists.length > 0 && (
        <>
          <div className="sidebar-section">Плейлисты</div>
          <div className="playlist-list">
            {playlists.map(pl => (
              <button key={pl.kind}
                className={`playlist-link ${view.name === 'playlist' && view.playlist?.kind === pl.kind ? 'active' : ''}`}
                onClick={() => setView({ name: 'playlist', playlist: pl })}
                title={pl.title}>
                <span className="playlist-dot" />
                <span className="playlist-name-text">{pl.title}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {playlists.length === 0 && <div className="sidebar-spacer" />}

      <div className="sidebar-footer">
        <button className="theme-btn" onClick={() => setSettingsOpen(true)}>
          <IconSettings size={18} /> Настройки
        </button>
        <div className="user-chip">
          <div className="avatar">{initials(name)}</div>
          <div className="user-info">
            <div className="user-name" title={name}>{name}</div>
            {sub && <div className="user-sub" title={sub}>@{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onLogout} title="Выйти">
            <IconLogout size={18} />
          </button>
        </div>
      </div>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </aside>
  )
}
