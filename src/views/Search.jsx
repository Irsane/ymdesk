import React, { useState, useCallback, useRef } from 'react'
import { api } from '../api.js'
import TrackList from '../components/TrackList.jsx'

export default function Search() {
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const timer = useRef(null)

  const run = useCallback(async (text) => {
    if (!text.trim()) { setTracks([]); setSearched(false); return }
    setLoading(true)
    setError(null)
    try {
      const res = await api.search(text.trim(), { type: 'track' })
      setTracks(res.tracks?.results || [])
      setSearched(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Поиск с дебаунсом по мере ввода.
  const onChange = (e) => {
    const v = e.target.value
    setQ(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => run(v), 400)
  }

  return (
    <div className="view">
      <h2 className="view-title">Поиск</h2>
      <input
        className="search-input"
        placeholder="Трек, исполнитель, альбом…"
        value={q}
        onChange={onChange}
        onKeyDown={(e) => e.key === 'Enter' && run(q)}
        autoFocus
      />

      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}
      {!loading && searched && !tracks.length && <div className="muted">Ничего не найдено.</div>}
      {!loading && tracks.length > 0 && <TrackList tracks={tracks} />}
    </div>
  )
}
