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
    throw new Error(`VK ${json.error.error_code}: ${json.error.error_msg}`)
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
  getProfile, search, userAudios, getPlaylists, getPlaylist, getRecommendations
}
