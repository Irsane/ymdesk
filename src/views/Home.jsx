import React, { useEffect, useState } from 'react'
import { api, coverUrl } from '../api.js'

export default function Home({ setView }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const feed = await api.feed()
        const gen = (feed.generatedPlaylists || [])
          .map(g => g.data)
          .filter(Boolean)
        setPlaylists(gen)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="view"><div className="spinner" /></div>
  if (error) return <div className="view"><div className="error-box">{error}</div></div>

  return (
    <div className="view">
      <h2 className="view-title">Главная</h2>
      <p className="view-sub">Персональные подборки для вас</p>

      <div className="card-grid">
        {playlists.map(pl => (
          <button
            key={`${pl.uid}:${pl.kind}`}
            className="card"
            onClick={() => setView({ name: 'playlist', playlist: pl })}
          >
            <div className="card-cover">
              {coverUrl(pl.cover?.uri || pl.ogImage, 300)
                ? <img src={coverUrl(pl.cover?.uri || pl.ogImage, 300)} alt="" />
                : <div className="cover-ph big">♪</div>}
            </div>
            <div className="card-title">{pl.title}</div>
            <div className="card-sub">{pl.trackCount || ''} треков</div>
          </button>
        ))}
        {!playlists.length && <div className="muted">Подборки не найдены.</div>}
      </div>
    </div>
  )
}
