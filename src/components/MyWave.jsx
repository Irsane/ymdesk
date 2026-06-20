import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'
import { usePlayer } from '../player.jsx'
import { IconPlay } from './Icons.jsx'

const STATION = 'user:onyourwave'

// «Моя волна» — персональное радио с выбором характера/настроения/языка.
export default function MyWave() {
  const player = usePlayer()
  const [groups, setGroups] = useState([])      // [{ key, name, options:[{value,name}] }]
  const [selected, setSelected] = useState({})  // { moodEnergy, diversity, language }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Загружаем доступные настройки станции.
  useEffect(() => {
    (async () => {
      try {
        const info = await api.rotorInfo(STATION)
        const r = info?.restrictions2 || info?.restrictions || {}
        const cur = info?.station?.settings2 || info?.settings2 || {}
        const order = ['diversity', 'moodEnergy', 'language']
        const labels = { diversity: 'Характер', moodEnergy: 'Настроение', language: 'Язык' }
        const gs = order
          .filter(k => r[k]?.possibleValues?.length)
          .map(k => ({
            key: k,
            name: labels[k] || k,
            options: r[k].possibleValues.map(v => ({ value: v.value, name: v.name }))
          }))
        setGroups(gs)
        const init = {}
        gs.forEach(g => { init[g.key] = cur[g.key] || g.options[0].value })
        setSelected(init)
      } catch (e) {
        // Настройки недоступны — оставим только кнопку запуска волны.
        setError(null)
      }
    })()
  }, [])

  const pick = (key, value) => setSelected(s => ({ ...s, [key]: value }))

  // Запуск волны: применяем настройки и грузим треки.
  const playWave = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (Object.keys(selected).length) {
        await api.rotorSettings(STATION, selected).catch(() => {})
      }
      const tracks = await api.rotorTracks(STATION)
      if (!tracks.length) throw new Error('Волна не вернула треки')
      // extender — бесконечная догрузка следующих треков.
      const extender = async () => {
        try { return await api.rotorTracks(STATION) } catch { return [] }
      }
      player.playWave(tracks, extender)
    } catch (e) {
      setError(e.message || 'Не удалось запустить волну')
    } finally {
      setLoading(false)
    }
  }, [selected, player])

  return (
    <section className="wave">
      <div className="wave-orb" aria-hidden>
        <span /><span /><span />
      </div>

      <div className="wave-body">
        <div className="wave-head">
          <h2 className="wave-title">Моя волна</h2>
          <p className="wave-sub">Бесконечный поток музыки, подобранный под вас</p>
        </div>

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

        <button className="wave-play" onClick={playWave} disabled={loading}>
          {loading ? <span className="spinner sm" /> : <IconPlay size={18} />} Слушать волну
        </button>
      </div>
    </section>
  )
}
