import React, { useState } from 'react'
import { api } from '../api.js'

// Вход в VK. Основной способ — окно настоящего сайта VK (токен ловится
// автоматически). Логин/пароль и готовый токен — запасные варианты.
export default function VkAuthForm({ onConnected }) {
  const [mode, setMode] = useState('browser') // 'browser' | 'password' | 'token'
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [need2fa, setNeed2fa] = useState(false)
  const [phone, setPhone] = useState('')
  const [captchaSid, setCaptchaSid] = useState(null)
  const [captchaImg, setCaptchaImg] = useState(null)
  const [captchaKey, setCaptchaKey] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const browserLogin = async () => {
    setBusy(true); setError(null)
    try {
      const res = await api.vkOauth()
      if (res.status === 'ok') onConnected(res.profile)
      else if (res.status === 'cancelled') setError('Вход отменён')
      else setError(res.error || 'Не удалось войти')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const loginPassword = async (e) => {
    e.preventDefault()
    if (!login.trim() || !password) return
    setBusy(true); setError(null)
    try {
      const res = await api.vkAuth({
        login: login.trim(), password,
        code: code.trim() || undefined,
        captchaSid: captchaSid || undefined,
        captchaKey: captchaKey.trim() || undefined
      })
      if (res.status === 'ok') { onConnected(res.profile); return }
      if (res.status === '2fa') { setNeed2fa(true); setPhone(res.phone || ''); setError('Введите код подтверждения') }
      else if (res.status === 'captcha') { setCaptchaSid(res.captchaSid); setCaptchaImg(res.captchaImg); setError('Введите символы с картинки') }
      else setError(res.error || 'Не удалось войти')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const useToken = async (e) => {
    e.preventDefault()
    if (!token.trim()) return
    setBusy(true); setError(null)
    try { onConnected(await api.vkSetToken(token.trim())) }
    catch (err) { setError(err.message || 'Неверный токен') } finally { setBusy(false) }
  }

  return (
    <div className="vk-auth">
      <div className="vk-tabs">
        <button className={`vk-tab ${mode === 'browser' ? 'active' : ''}`} onClick={() => { setMode('browser'); setError(null) }}>Через VK</button>
        <button className={`vk-tab ${mode === 'password' ? 'active' : ''}`} onClick={() => { setMode('password'); setError(null) }}>Логин/пароль</button>
        <button className={`vk-tab ${mode === 'token' ? 'active' : ''}`} onClick={() => { setMode('token'); setError(null) }}>Токен</button>
      </div>

      {mode === 'browser' && (
        <div>
          <button className="btn-primary" onClick={browserLogin} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Ожидание входа…' : 'Войти через VK'}
          </button>
          {error && <div className="login-error" style={{ marginTop: 10 }}>{error}</div>}
          <p className="hint" style={{ marginTop: 10 }}>
            Откроется официальная страница VK — вы входите прямо на сайте VK, а
            приложение само получит доступ. Пароль вводится только на vk.com.
          </p>
        </div>
      )}

      {mode === 'password' && (
        <form onSubmit={loginPassword}>
          <input className="token-input" placeholder="Телефон или email" value={login} onChange={(e) => setLogin(e.target.value)} autoFocus />
          <input className="token-input" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
          {need2fa && <input className="token-input" placeholder={`Код подтверждения${phone ? ` (${phone})` : ''}`} value={code} onChange={(e) => setCode(e.target.value)} />}
          {captchaImg && (
            <div className="vk-captcha">
              <img src={captchaImg} alt="captcha" />
              <input className="token-input" placeholder="Символы с картинки" value={captchaKey} onChange={(e) => setCaptchaKey(e.target.value)} />
            </div>
          )}
          {error && <div className="login-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Входим…' : 'Войти'}
          </button>
        </form>
      )}

      {mode === 'token' && (
        <form onSubmit={useToken}>
          <input className="token-input" type="password" placeholder="VK-токен с доступом к аудио" value={token} onChange={(e) => setToken(e.target.value)} autoFocus />
          {error && <div className="login-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Проверяем…' : 'Подключить'}
          </button>
        </form>
      )}
    </div>
  )
}
