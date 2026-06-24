import React, { useState, useEffect, useRef } from 'react'
import { IconSearch, IconPrev } from './Icons.jsx'

const TITLES = {
  home: 'Главная',
  search: 'Поиск',
  liked: 'Мне нравится',
  playlist: 'Плейлист',
  artist: 'Исполнитель',
  album: 'Альбом'
}

// Верхняя панель: контекст текущего раздела, кнопка «назад» для подстраниц
// и постоянный глобальный поиск с debounce-подсказками.
export default function TopBar({ view, setView, goBack, canBack }) {
  const [q, setQ] = useState('')
  const timer = useRef(null)

  // Уходим с поиска — очищаем поле.
  useEffect(() => { if (view.name !== 'search') setQ('') }, [view.name])

  const onChange = (e) => {
    const v = e.target.value
    setQ(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (v.trim()) setView({ name: 'search', q: v.trim() })
    }, 350)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        {canBack && (
          <button className="icon-btn topbar-back" onClick={goBack} title="Назад" aria-label="Назад">
            <IconPrev size={18} />
          </button>
        )}
        <span className="topbar-title">{TITLES[view.name] || 'Hailu'}</span>
      </div>

      <div className="topbar-search">
        <IconSearch size={18} />
        <input
          type="search"
          value={q}
          onChange={onChange}
          placeholder="Поиск треков и исполнителей…"
          aria-label="Поиск"
        />
      </div>
    </header>
  )
}
