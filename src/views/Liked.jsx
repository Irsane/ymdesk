import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { usePlayer } from '../player.jsx'
import TrackList from '../components/TrackList.jsx'

export default function Liked() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const player = usePlayer()

  useEffect(() => {
    (async () => {
      try {
        // Помечаем все как liked для корректного отображения сердечка.
        const t = (await api.liked()).map(x => ({ ...x, liked: true }))
        setTracks(t)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2 className="view-title">Мне нравится</h2>
          <p className="view-sub">{tracks.length} треков</p>
        </div>
        {tracks.length > 0 && (
          <button className="btn-primary" onClick={() => player.playQueue(tracks, 0)}>
            ▶ Слушать
          </button>
        )}
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}
      {!loading && !error && <TrackList tracks={tracks} />}
    </div>
  )
}
