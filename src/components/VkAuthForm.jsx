import React, { useState } from 'react'
import { api } from '../api.js'

// Единственный рабочий способ доступа к музыке VK — вход логином/паролем
// (метод Kate Mobile). Поддержаны 2FA и капча. Пароль уходит только в
// oauth.vk.com и не сохраняется — хранится лишь полученный токен.
export default function VkAuthForm({ onConnected }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [need2fa, setNeed2fa] = useState(false)
  const [phone, setPhone] = useState('')
  const [captchaSid, setCaptchaSid] = useState(null)
  const [captchaImg, setCaptchaImg] = useState(null)
  const [captchaKey, setCaptchaKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
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

  return (
    <form className="vk-auth" onSubmit={submit}>
      <input className="token-input" placeholder="Телефон или email"
        value={login} onChange={(e) => setLogin(e.target.value)} autoFocus />
      <input className="token-input" type="password" placeholder="Пароль"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      {need2fa && (
        <input className="token-input" placeholder={`Код подтверждения${phone ? ` (${phone})` : ''}`}
          value={code} onChange={(e) => setCode(e.target.value)} />
      )}
      {captchaImg && (
        <div className="vk-captcha">
          <img src={captchaImg} alt="captcha" />
          <input className="token-input" placeholder="Символы с картинки"
            value={captchaKey} onChange={(e) => setCaptchaKey(e.target.value)} />
        </div>
      )}
      {error && <div className="login-error">{error}</div>}
      <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
        {busy ? 'Входим…' : 'Войти в VK'}
      </button>
      <p className="hint" style={{ marginTop: 10 }}>
        Это единственный способ получить доступ к музыке VK (ограничение VK —
        обычный токен музыку не отдаёт). Логин и пароль уходят напрямую на
        <code>oauth.vk.com</code> и нигде не сохраняются — хранится только токен.
      </p>
    </form>
  )
}
