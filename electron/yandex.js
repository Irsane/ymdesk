'use strict'

const crypto = require('crypto')

// Базовый адрес неофициального API Яндекс Музыки.
const API = 'https://api.music.yandex.net'

// Заголовки клиента. X-Yandex-Music-Client заставляет API отдавать
// данные так, как это делает мобильное приложение.
function baseHeaders(token) {
  const h = {
    'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621',
    'User-Agent': 'YandexMusicAndroid/24023621',
    'Accept-Language': 'ru'
  }
  if (token) h['Authorization'] = `OAuth ${token}`
  return h
}

// Универсальный запрос к API. Бросает осмысленную ошибку при не-2xx.
async function apiFetch(token, path, { method = 'GET', params, body, headers } = {}) {
  const url = new URL(path.startsWith('http') ? path : API + path)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }

  const opts = { method, headers: { ...baseHeaders(token), ...headers } }
  if (body !== undefined) {
    if (body instanceof URLSearchParams) {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      opts.body = body.toString()
    } else {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
  }

  const res = await fetch(url, opts)
  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : {} } catch { json = { raw: text } }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText || 'Ошибка запроса'
    const err = new Error(`API ${res.status}: ${msg}`)
    err.status = res.status
    throw err
  }
  // API оборачивает данные в { invocationInfo, result }.
  return json.result !== undefined ? json.result : json
}

// --- Высокоуровневые методы ---

// Информация об аккаунте (используется как проверка валидности токена).
async function getAccountStatus(token) {
  return apiFetch(token, '/account/status')
}

// Лента/главная — персональные подборки.
async function getFeed(token) {
  return apiFetch(token, '/feed')
}

// Новые плейлисты редакции (много карточек для главной).
async function getNewPlaylists(token) {
  const res = await apiFetch(token, '/landing3/new-playlists')
  return res?.newPlaylists || res?.result?.newPlaylists || []
}

// Чарт (топ треков) — как плейлист.
async function getChart(token) {
  const res = await apiFetch(token, '/landing3/chart')
  return res?.chart || res
}

// Список плейлистов пользователя.
async function getUserPlaylists(token, uid) {
  return apiFetch(token, `/users/${uid}/playlists/list`)
}

// Полный плейлист с треками.
async function getPlaylist(token, uid, kind) {
  return apiFetch(token, `/users/${uid}/playlists/${kind}`)
}

// Понравившиеся треки (только id), затем подгружаем сами треки.
async function getLikedTracks(token, uid) {
  const liked = await apiFetch(token, `/users/${uid}/likes/tracks`)
  const ids = (liked.library?.tracks || []).map(t => t.id).slice(0, 200)
  if (!ids.length) return []
  return getTracksByIds(token, ids)
}

// Получить полные данные треков по списку id.
async function getTracksByIds(token, ids) {
  const body = new URLSearchParams()
  body.set('track-ids', ids.join(','))
  body.set('with-positions', 'true')
  return apiFetch(token, '/tracks', { method: 'POST', body })
}

// Поиск (треки, альбомы, артисты, плейлисты).
async function search(token, text, { type = 'all', page = 0 } = {}) {
  return apiFetch(token, '/search', {
    params: { text, type, page, 'nocorrect': false }
  })
}

// Лайк/дизлайк трека.
async function setLike(token, uid, trackId, like) {
  const action = like ? 'add-multiple' : 'remove'
  const body = new URLSearchParams()
  body.set('track-ids', trackId)
  return apiFetch(token, `/users/${uid}/likes/tracks/${action}`, { method: 'POST', body })
}

// --- Получение прямой ссылки на аудио (с подписью) ---

const SIGN_SALT = 'XGRlBW9FXlekgbPrRHuSiA'

// download-info отдаёт список вариантов качества. Берём лучший mp3,
// затем по downloadInfoUrl получаем host/path/ts/s и считаем подпись.
async function getTrackUrl(token, trackId) {
  const info = await apiFetch(token, `/tracks/${trackId}/download-info`)
  if (!Array.isArray(info) || !info.length) {
    throw new Error('Нет доступных вариантов для воспроизведения')
  }
  // Сортируем по битрейту, предпочитаем mp3.
  const best = info
    .filter(i => i.codec === 'mp3')
    .sort((a, b) => (b.bitrateInKbps || 0) - (a.bitrateInKbps || 0))[0] || info[0]

  const dl = await apiFetch(token, best.downloadInfoUrl, { params: { format: 'json' } })
  const { host, path, ts, s } = dl
  const sign = crypto
    .createHash('md5')
    .update(SIGN_SALT + path.slice(1) + s)
    .digest('hex')

  return `https://${host}/get-mp3/${sign}/${ts}${path}`
}

// --- Моя волна (rotor) ---

// Информация о станции: текущие настройки и доступные значения
// (характер/настроение, разнообразие, язык) для выбора в UI.
async function getRotorInfo(token, station = 'user:onyourwave') {
  const res = await apiFetch(token, `/rotor/station/${station}/info`)
  // API может вернуть массив станций — берём первую.
  return Array.isArray(res) ? res[0] : res
}

// Применить настройки волны (moodEnergy / diversity / language).
async function setRotorSettings(token, station = 'user:onyourwave', settings = {}) {
  return apiFetch(token, `/rotor/station/${station}/settings2`, {
    method: 'POST',
    body: settings
  })
}

// Получить очередную порцию треков станции.
async function getRotorTracks(token, station = 'user:onyourwave', lastTrackId) {
  const params = { settings2: true }
  if (lastTrackId) params.queue = lastTrackId
  const res = await apiFetch(token, `/rotor/station/${station}/tracks`, { params })
  return (res.sequence || [])
    .filter(s => s.type === 'track' && s.track)
    .map(s => s.track)
}

// Удобный helper: собрать URL обложки нужного размера.
function coverUrl(uri, size = 400) {
  if (!uri) return null
  return 'https://' + uri.replace('%%', `${size}x${size}`)
}

module.exports = {
  getAccountStatus,
  getFeed,
  getNewPlaylists,
  getChart,
  getUserPlaylists,
  getPlaylist,
  getLikedTracks,
  getTracksByIds,
  search,
  setLike,
  getTrackUrl,
  getRotorInfo,
  setRotorSettings,
  getRotorTracks,
  coverUrl
}
