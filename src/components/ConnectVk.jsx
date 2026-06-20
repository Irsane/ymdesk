import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api.js'
import { IconClose } from './Icons.jsx'

// Токен Kate Mobile (неофициальный доступ к аудио VK).
const VK_OAUTH =
  'https://oauth.vk.com/authorize?client_id=2685278&scope=audio,offline&redirect_uri=https://oauth.vk.com/blank.html&display=mobile&response_type=token&revoke=1'

export default function ConnectVk({ onClose, onConnected }) {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    const clean = token.trim()
    if (!clean) return
    setBusy(true); setError(null)
    try {
      const profile = await api.vkSetToken(clean)
      onConnected(profile)
    } catch (err) {
      setError(err.message || 'Не удалось подключить VK')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Подключить VK Музыку">
        <div className="modal-head">
          <h3 className="modal-title">Подключить VK Музыку</h3>
          <button className="icon-btn" onClick={onClose} title="Закрыть"><IconClose size={18} /></button>
        </div>
        <div className="modal-body">
          <form onSubmit={submit}>
            <label className="field-label">VK-токен (Kate Mobile)</label>
            <input
              className="token-input" type="password" placeholder="Вставьте токен"
              value={token} onChange={(e) => setToken(e.target.value)} autoFocus
            />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
              {busy ? 'Проверяем…' : 'Подключить'}
            </button>
          </form>
          <div className="login-help">
            <a href={VK_OAUTH} target="_blank" rel="noreferrer">Получить VK-токен →</a>
            <p className="hint">
              Откройте ссылку, войдите в VK и разрешите доступ. Скопируйте значение
              <code>access_token</code> из адресной строки после редиректа на
              <code>oauth.vk.com/blank.html</code>.
              <br />Неофициальный доступ к музыке — используйте на свой риск.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
