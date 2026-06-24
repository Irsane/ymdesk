import React, { useState, useEffect } from 'react'
import { api } from '../api.js'
import TrackList from '../components/TrackList.jsx'
import { IconSearch } from '../components/Icons.jsx'

// Запрос приходит из верхней панели (TopBar). Здесь — только результаты.
export default function Search({ query = '' }) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const text = query.trim()
    if (!text) { setTracks([]); setSearched(false); setError(null); return }
    let live = true
    setLoading(true); setError(null)
    api.search(text, { type: 'track' })
      .then(res => { if (live) { setTracks(res.tracks?.results || []); setSearched(true) } })
      .catch(e => { if (live) setError(e.message) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [query])

  return (
    <div className="view">
      {!query.trim() && (
        <div className="empty-state">
          <span className="empty-ic"><IconSearch size={28} /></span>
          <div className="empty-title">Что хотите послушать?</div>
          <div className="empty-sub">Начните вводить запрос в строке поиска сверху.</div>
        </div>
      )}
      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}
      {!loading && searched && !tracks.length && <div className="muted">По запросу «{query}» ничего не найдено.</div>}
      {!loading && tracks.length > 0 && (
        <>
          <h2 className="view-title">Результаты</h2>
          <TrackList tracks={tracks} />
        </>
      )}
    </div>
  )
}
