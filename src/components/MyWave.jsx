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
      await api.rotorSettings(STATION, selected).catch(() => {})
      const first = await api.rotorTracks(STATION)
      if (!first.tracks?.length) throw new Error('Волна не вернула треки')

      // Ротору нужен ПОЛНЫЙ id вида "id:albumId" — иначе queue игнорируется
      // и станция повторяет ту же пятёрку.
      const fullId = (t) => (t.albums?.[0]?.id ? `${t.id}:${t.albums[0].id}` : String(t.id))
      const seen = new Set(first.tracks.map(t => String(t.id)))
      let batchId = first.batchId
      let lastId = fullId(first.tracks[first.tracks.length - 1])
      api.rotorFeedback(STATION, { type: 'radioStarted', from: 'hailu-desktop', batchId }).catch(() => {})

      const extender = async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await api.rotorFeedback(STATION, { type: 'trackFinished', trackId: lastId, totalPlayedSeconds: 30, batchId }).catch(() => {})
            const res = await api.rotorTracks(STATION, lastId)
            batchId = res.batchId
            const fresh = (res.tracks || []).filter(t => !seen.has(String(t.id)))
            if (res.tracks?.length) lastId = fullId(res.tracks[res.tracks.length - 1])
            if (fresh.length) { fresh.forEach(t => seen.add(String(t.id))); return fresh }
          } catch { return [] }
        }
        return []
      }
      player.playWave(first.tracks, extender)
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
