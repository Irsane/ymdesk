// Чистая логика очереди плеера — без React и аудио, чтобы покрыть тестами.
export function idOf(t) {
  return String((t && (t.id ?? t.trackId)) ?? '')
}

export class Queue {
  constructor() {
    this.tracks = []
    this.index = -1
    this.seen = new Set()
    this.extender = null
  }

  setList(tracks, extender = null) {
    this.tracks = (tracks || []).filter(Boolean)
    this.index = this.tracks.length ? 0 : -1
    this.seen = new Set(this.tracks.map(idOf))
    this.extender = extender
  }

  current() {
    return this.index >= 0 ? this.tracks[this.index] : null
  }

  // Добавляет только не виденные ранее треки. Возвращает реально добавленные.
  append(more) {
    const fresh = []
    for (const t of more || []) {
      const id = idOf(t)
      if (id && !this.seen.has(id)) {
        this.seen.add(id)
        this.tracks.push(t)
        fresh.push(t)
      }
    }
    return fresh
  }

  // Индекс следующего трека. rng — для предсказуемого теста shuffle.
  peekNext({ shuffle = false, repeat = 'off', rng = Math.random } = {}) {
    if (!this.tracks.length) return null
    if (shuffle) return Math.floor(rng() * this.tracks.length)
    if (this.index < this.tracks.length - 1) return this.index + 1
    if (repeat === 'all') return 0
    return null // конец очереди
  }

  peekPrev() {
    return this.index > 0 ? this.index - 1 : this.index
  }

  // Пора ли подгружать следующую пачку (играют последние 2 трека).
  needsPrefetch() {
    return !!this.extender && this.index >= this.tracks.length - 2
  }

  setIndex(i) {
    if (i >= 0 && i < this.tracks.length) this.index = i
  }
}
