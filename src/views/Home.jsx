import React, { useEffect, useState } from 'react'
import { api, coverUrl } from '../api.js'
import MyWave from '../components/MyWave.jsx'

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

  return (
    <div className="view">
      <MyWave />

      <h2 className="view-title section-gap">Подборки для вас</h2>
      <p className="view-sub">Персональные плейлисты на каждый день</p>

      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}

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
        {!loading && !playlists.length && <div className="muted">Подборки не найдены.</div>}
      </div>
    </div>
  )
}
