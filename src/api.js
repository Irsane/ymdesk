// Тонкая обёртка над window.ym (preload). Разворачивает { ok, data }
// в данные либо бросает ошибку — удобно для async/await в компонентах.

const ym = window.ym

async function call(method, ...args) {
  const res = await ym[method](...args)
  if (res && typeof res === 'object' && 'ok' in res) {
    if (!res.ok) throw new Error(res.error)
    return res.data
  }
  return res
}

export const api = {
  getToken: () => ym.getToken(),
  setToken: (t) => ym.setToken(t),
  logout: () => ym.logout(),

  account: () => call('account'),
  feed: () => call('feed'),
  newPlaylists: () => call('newPlaylists'),
  chart: () => call('chart'),
  playlists: () => call('playlists'),
  playlist: (ownerUid, kind) => call('playlist', ownerUid, kind),
  liked: () => call('liked'),
  search: (text, opts) => call('search', text, opts),
  artist: (id) => call('artist', id),
  album: (id) => call('album', id),
  trackUrl: (id) => call('trackUrl', id),
  like: (id, like) => call('like', id, like),

  rotorInfo: (station) => call('rotorInfo', station),
  rotorSettings: (station, settings) => call('rotorSettings', station, settings),
  rotorTracks: (station, queue) => call('rotorTracks', station, queue),
  rotorFeedback: (station, payload) => call('rotorFeedback', station, payload),

  setMini: (on, size) => window.ym.setMini(on, size)
}

// Сборка URL обложки нужного размера.
export function coverUrl(uri, size = 200) {
  if (!uri) return null
  return 'https://' + uri.replace('%%', `${size}x${size}`)
}

// Удобное форматирование артистов и времени.
export function artistsStr(track) {
  return (track?.artists || []).map(a => a.name).join(', ') || 'Неизвестный исполнитель'
}

export function fmtTime(sec) {
  if (!sec && sec !== 0) return '0:00'
  const s = Math.floor(sec % 60)
  const m = Math.floor(sec / 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
