'use strict'

// Неофициальный доступ к аудио VK через токен Kate Mobile.
// Официального API для музыки у VK нет — используется клиентский токен и
// User-Agent Kate Mobile. Это против правил VK и может быть нестабильным.

const UA = 'KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)'
const V = '5.95'

async function vkFetch(token, method, params = {}) {
  const url = new URL('https://api.vk.com/method/' + method)
  url.searchParams.set('access_token', token)
  url.searchParams.set('v', V)
  for (const [k, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) url.searchParams.set(k, String(val))
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const json = await res.json()
  if (json.error) {
    const code = json.error.error_code
    // 3 = Unknown method / нет доступа к аудио у этого токена.
    if (code === 3 || code === 15) {
      throw new Error('Токен VK без доступа к музыке. Войдите через «Логин/пароль» (вкладка в окне входа VK).')
    }
    throw new Error(`VK ${code}: ${json.error.error_msg}`)
  }
  return json.response
}

// Трек VK → единый формат приложения.
function normTrack(a) {
  if (!a || !a.url) return null
  return {
    id: `${a.owner_id}_${a.id}`,
    trackId: `${a.owner_id}_${a.id}`,
    title: a.title || 'Без названия',
    artists: [{ name: a.artist || 'Неизвестный исполнитель' }],
    durationMs: (a.duration || 0) * 1000,
    coverUri: a.album?.thumb?.photo_300 || a.album?.thumb?.photo_270 || a.album?.thumb?.photo_135 || null,
    url: a.url,
    liked: true,
    _source: 'vk'
  }
}

function normPlaylist(p) {
  return {
    _source: 'vk',
    id: p.id,
    kind: String(p.id),
    ownerId: p.owner_id,
    accessKey: p.access_key || '',
    title: p.title || 'Плейлист',
    cover: p.photo?.photo_600 || p.photo?.photo_300 || p.thumbs?.[0]?.photo_300 || null,
    trackCount: p.count
  }
}

// --- Авторизация по логину/паролю (Kate Mobile) ---
// Только так выдаётся токен с РЕАЛЬНЫМ доступом к аудио. Браузерный
// implicit-токен музыку больше не отдаёт. Пароль уходит напрямую на
// oauth.vk.com и нигде не сохраняется.
const KATE = { id: '2685278', secret: 'lxhD8OD7dMsqtXIm5IUY' }

async function auth({ login, password, code, captchaSid, captchaKey, deviceId }) {
  const u = new URL('https://oauth.vk.com/token')
  const p = u.searchParams
  p.set('grant_type', 'password')
  p.set('client_id', KATE.id)
  p.set('client_secret', KATE.secret)
  p.set('username', login)
  p.set('password', password)
  p.set('scope', 'audio,offline')
  p.set('2fa_supported', '1')
  p.set('v', V)
  p.set('lang', 'ru')
  if (deviceId) p.set('device_id', deviceId)
  if (code) p.set('code', code)
  if (captchaSid) { p.set('captcha_sid', captchaSid); p.set('captcha_key', captchaKey || '') }

  const res = await fetch(u, { headers: { 'User-Agent': UA } })
  const j = await res.json()

  if (j.access_token) return { token: j.access_token, userId: j.user_id }
  if (j.error === 'need_validation') {
    return { needValidation: true, phone: j.phone_mask, type: j.validation_type }
  }
  if (j.error === 'need_captcha') {
    return { needCaptcha: true, captchaSid: j.captcha_sid, captchaImg: j.captcha_img }
  }
  throw new Error(j.error_description || j.error || 'Ошибка входа VK')
}

async function getProfile(token) {
  const r = await vkFetch(token, 'users.get', { fields: 'photo_200' })
  return Array.isArray(r) ? r[0] : r
}

async function search(token, q) {
  const r = await vkFetch(token, 'audio.search', { q, count: 100, auto_complete: 1 })
  return (r.items || []).map(normTrack).filter(Boolean)
}

async function userAudios(token, ownerId) {
  const r = await vkFetch(token, 'audio.get', { owner_id: ownerId, count: 200 })
  return (r.items || []).map(normTrack).filter(Boolean)
}

async function getPlaylists(token, ownerId) {
  const r = await vkFetch(token, 'audio.getPlaylists', { owner_id: ownerId, count: 100 })
  return (r.items || []).map(normPlaylist)
}

async function getPlaylist(token, ownerId, albumId, accessKey) {
  const r = await vkFetch(token, 'audio.get', {
    owner_id: ownerId, album_id: albumId, access_key: accessKey, count: 300
  })
  return (r.items || []).map(normTrack).filter(Boolean)
}

async function getRecommendations(token) {
  const r = await vkFetch(token, 'audio.getRecommendations', { count: 100 })
  return (r.items || []).map(normTrack).filter(Boolean)
}

module.exports = {
  auth, getProfile, search, userAudios, getPlaylists, getPlaylist, getRecommendations
}
