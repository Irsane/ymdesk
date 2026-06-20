import React, { useState } from 'react'
import { api } from '../api.js'

// Единственный способ входа в VK — авторизация Kate Mobile на сайте VK.
// Открывается окно официальной страницы VK, токен ловится автоматически.
export default function VkAuthForm({ onConnected }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const login = async () => {
    setBusy(true); setError(null)
    try {
      const res = await api.vkOauth()
      if (res.status === 'ok') onConnected(res.profile)
      else if (res.status === 'cancelled') setError('Вход отменён')
      else setError(res.error || 'Не удалось войти')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="vk-auth">
      <button className="btn-primary" onClick={login} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
        {busy ? 'Ожидание входа…' : 'Войти через Kate Mobile'}
      </button>
      {error && <div className="login-error" style={{ marginTop: 10 }}>{error}</div>}
      <p className="hint" style={{ marginTop: 10 }}>
        Откроется официальная страница VK. Вы входите прямо на сайте VK и
        разрешаете доступ — приложение само получит токен с доступом к музыке.
        Пароль вводится только на vk.com.
      </p>
    </div>
  )
}
