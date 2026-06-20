import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../theme.jsx'
import { IconPalette, IconCheck } from './Icons.jsx'

// Кнопка + всплывающее меню выбора оформления.
export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Закрытие по клику вне меню.
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="theme-switch" ref={ref}>
      <button className="theme-btn" onClick={() => setOpen(o => !o)} title="Сменить оформление">
        <IconPalette size={18} /> Оформление
      </button>

      {open && (
        <div className="theme-menu" role="menu">
          {themes.map(t => (
            <button
              key={t.id}
              className={`theme-opt ${theme === t.id ? 'active' : ''}`}
              onClick={() => { setTheme(t.id); setOpen(false) }}
              role="menuitemradio"
              aria-checked={theme === t.id}
            >
              <span className={`theme-dot t-${t.id}`} />
              <span className="theme-opt-text">
                <span className="theme-opt-name">{t.name}</span>
                <span className="theme-opt-hint">{t.hint}</span>
              </span>
              {theme === t.id && <span className="theme-opt-check"><IconCheck size={16} /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
