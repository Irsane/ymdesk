import React, { useState } from 'react'
import { api } from '../api.js'
import Logo, { Wordmark } from './Logo.jsx'

const OAUTH_URL =
  'https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d'

export default function Login({ onLogin }) {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    const clean = token.trim()
    if (!clean) return
    setBusy(true); setError(null)
    try {
      const status = await api.setToken(clean)
      onLogin(status, clean)
    } catch (err) {
      setError(err.message || 'Не удалось войти. Проверьте токен.')
    } finally { setBusy(false) }
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-logo">
          <Logo size={48} animated />
          <Wordmark size={30} />
        </div>
        <p className="login-sub">Музыка без границ</p>

        <form onSubmit={submit}>
          <label className="field-label">OAuth-токен</label>
          <input className="token-input" type="password" placeholder="Вставьте токен сюда"
            value={token} onChange={(e) => setToken(e.target.value)} autoFocus />
          {error && <div className="login-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Проверяем…' : 'Войти'}
          </button>
        </form>

        <div className="login-help">
          <a href={OAUTH_URL} target="_blank" rel="noreferrer">Получить OAuth-токен →</a>
          <p className="hint">
            Откройте ссылку, войдите в аккаунт Яндекса и скопируйте значение
            <code>access_token</code> из адресной строки после редиректа.
          </p>
        </div>
      </div>
    </div>
  )
}
