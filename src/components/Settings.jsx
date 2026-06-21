import React from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../theme.jsx'
import { useSettings } from '../settings.jsx'
import { IconClose, IconCheck } from './Icons.jsx'

const MINI_SHAPES = [
  { id: 'rect', name: 'Прямоугольный' },
  { id: 'square', name: 'Квадратный' }
]

export default function Settings({ onClose }) {
  const { theme, setTheme, themes } = useTheme()
  const { miniShape, setMiniShape, bgAnim, setBgAnim } = useSettings()

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal settings-modal" role="dialog" aria-label="Настройки">
        <div className="modal-head">
          <h3 className="modal-title">Настройки</h3>
          <button className="icon-btn" onClick={onClose} title="Закрыть"><IconClose size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <div className="settings-label">Оформление</div>
            <div className="settings-themes">
              {themes.map(t => (
                <button key={t.id} className={`theme-opt ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
                  <span className={`theme-dot t-${t.id}`} />
                  <span className="theme-opt-text">
                    <span className="theme-opt-name">{t.name}</span>
                    <span className="theme-opt-hint">{t.hint}</span>
                  </span>
                  {theme === t.id && <span className="theme-opt-check"><IconCheck size={16} /></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Мини-плеер</div>
            <div className="seg">
              {MINI_SHAPES.map(s => (
                <button key={s.id} className={`seg-btn ${miniShape === s.id ? 'active' : ''}`} onClick={() => setMiniShape(s.id)}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-row">
              <div>
                <div className="settings-label" style={{ marginBottom: 2 }}>Фоновая анимация</div>
                <div className="settings-hint">Частицы и снежинки на фоне приложения</div>
              </div>
              <button className={`toggle ${bgAnim ? 'on' : ''}`} onClick={() => setBgAnim(v => !v)} aria-pressed={bgAnim}>
                <span className="toggle-knob" />
              </button>
            </div>
          </div>

          <div className="settings-foot">Hailu — десктоп-клиент Яндекс Музыки</div>
        </div>
      </div>
    </div>,
    document.body
  )
}
