import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api.js'
import { usePlayer } from '../player.jsx'
import { IconPlay, IconClose } from './Icons.jsx'

const STATION = 'user:onyourwave'

// Готовые пресеты выбора волны (на случай, если info станции недоступен).
const PRESETS = [
  { key: 'diversity', name: 'Характер', options: [
    { value: 'default', name: 'По умолчанию' },
    { value: 'favorite', name: 'Любимое' },
    { value: 'popular', name: 'Популярное' },
    { value: 'discover', name: 'Незнакомое' },
    { value: 'diverse', name: 'Разнообразное' }
  ]},
  { key: 'moodEnergy', name: 'Настроение', options: [
    { value: 'all', name: 'Любое' },
    { value: 'active', name: 'Энергичное' },
    { value: 'fun', name: 'Весёлое' },
    { value: 'calm', name: 'Спокойное' },
    { value: 'sad', name: 'Грустное' }
  ]},
  { key: 'language', name: 'Язык', options: [
    { value: 'any', name: 'Любой' },
    { value: 'russian', name: 'Русский' },
    { value: 'not-russian', name: 'Не русский' }
  ]}
]

export default function MyWave() {
  const player = usePlayer()
  const [groups, setGroups] = useState(PRESETS)
  const [selected, setSelected] = useState({ diversity: 'default', moodEnergy: 'all', language: 'any' })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Подтягиваем реальные настройки станции, если доступны.
  useEffect(() => {
    (async () => {
      try {
        const info = await api.rotorInfo(STATION)
        const r = info?.restrictions2 || info?.restrictions || {}
        const cur = info?.station?.settings2 || info?.settings2 || {}
        const gs = PRESETS.map(g => {
          const real = r[g.key]?.possibleValues
          return real?.length
            ? { ...g, options: real.map(v => ({ value: v.value, name: v.name })) }
            : g
        })
        setGroups(gs)
        setSelected(s => ({
          diversity: cur.diversity || s.diversity,
          moodEnergy: cur.moodEnergy || s.moodEnergy,
          language: cur.language || s.language
        }))
      } catch { /* остаёмся на пресетах */ }
    })()
  }, [])

  const pick = (key, value) => setSelected(s => ({ ...s, [key]: value }))

  const start = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Применяем выбранные настройки (характер/настроение/язык) к станции —
      // их подхватит новая радио-сессия.
      await api.rotorSettings(STATION, selected).catch(() => {})

      // Открываем радио-сессию: дальше сервер сам исключает уже выданные
      // треки (через queue), поэтому повторов в потоке нет.
      const sess = await api.rotorSessionNew([STATION])
      if (!sess.tracks?.length) throw new Error('Волна не вернула треки')

      const sessionId = sess.radioSessionId
      let batchId = sess.batchId
      const seen = new Set()
      let queue = []
      const register = (arr) => arr.forEach(t => {
        const id = String(t.id)
        if (!seen.has(id)) { seen.add(id); queue.push(id) }
      })
      register(sess.tracks)
      api.rotorSessionFeedback(sessionId, { type: 'radioStarted', from: 'hailu-desktop' }).catch(() => {})

      // Запасной пул на самый крайний случай (сессия совсем недоступна),
      // чтобы скип всегда работал. В норме не используется.
      let pool = null, poolPos = 0
      const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]] } return a }

      const extender = async () => {
        // Сервер исключает выданное по queue. Передаём последние id (хвост),
        // пробуем пару раз — иногда первая пачка приходит без новинок.
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const tail = queue.slice(-150)
            const res = await api.rotorSessionTracks(sessionId, batchId, tail)
            batchId = res.batchId || batchId
            const fresh = (res.tracks || []).filter(t => !seen.has(String(t.id)))
            if (fresh.length) { register(fresh); return fresh }
          } catch { break }
        }

        // Крайний резерв — перемешанное «Мне нравится» (только если сессия молчит).
        if (!pool) pool = shuffle((await api.liked().catch(() => [])).filter(Boolean))
        if (!pool.length) return []
        if (poolPos >= pool.length) { shuffle(pool); poolPos = 0 }
        const chunk = pool.slice(poolPos, poolPos + 10)
        poolPos += 10
        return chunk
      }

      player.playWave(sess.tracks, extender)
      setOpen(false)
    } catch (e) {
      setError(e.message || 'Не удалось запустить волну')
    } finally {
      setLoading(false)
    }
  }, [selected, player])

  // Подпись выбранного для превью на карточке.
  const summary = groups
    .map(g => g.options.find(o => o.value === selected[g.key])?.name)
    .filter(Boolean).join(' · ')

  return (
    <section className="wave">
      <div className="wave-orb" aria-hidden><span /><span /><span /></div>

      <div className="wave-body">
        <div className="wave-head">
          <h2 className="wave-title">Моя волна</h2>
          <p className="wave-sub">Бесконечный поток музыки, подобранный под вас</p>
        </div>

        {summary && <div className="wave-summary">{summary}</div>}

        <button className="wave-play" onClick={() => setOpen(true)}>
          <IconPlay size={18} /> Слушать волну
        </button>
      </div>

      {open && createPortal(
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal" role="dialog" aria-label="Настройка волны">
            <div className="modal-head">
              <h3 className="modal-title">Настройте волну</h3>
              <button className="icon-btn" onClick={() => setOpen(false)} title="Закрыть"><IconClose size={18} /></button>
            </div>

            <div className="modal-body">
              {groups.map(g => (
                <div className="wave-group" key={g.key}>
                  <div className="wave-group-name">{g.name}</div>
                  <div className="chips">
                    {g.options.map(o => (
                      <button
                        key={o.value}
                        className={`chip ${selected[g.key] === o.value ? 'active' : ''}`}
                        onClick={() => pick(g.key, o.value)}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {error && <div className="wave-error">{error}</div>}
            </div>

            <div className="modal-foot">
              <button className="wave-play" onClick={start} disabled={loading}>
                {loading ? <span className="spinner sm" /> : <IconPlay size={18} />} Запустить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
