import React, { useEffect, useState } from 'react'
import { api, coverUrl } from '../api.js'
import { usePlayer } from '../player.jsx'
import TrackList from '../components/TrackList.jsx'
import { IconPlay } from '../components/Icons.jsx'

export default function Playlist({ info }) {
  const [data, setData] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const player = usePlayer()

  useEffect(() => {
    setLoading(true)
    setError(null)
    const ownerUid = info.uid || info.owner?.uid
    api.playlist(ownerUid, info.kind)
      .then(pl => {
        setData(pl)
        const list = (pl.tracks || []).map(t => t.track || t).filter(Boolean)
        setTracks(list)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [info.uid, info.kind])

  const cover = coverUrl(data?.cover?.uri || data?.ogImage || info.cover?.uri || info.ogImage, 300)

  return (
    <div className="view">
      <div className="playlist-header">
        <div className="playlist-cover">
          {cover ? <img src={cover} alt="" /> : <div className="cover-ph big">♪</div>}
        </div>
        <div className="playlist-info">
          <div className="playlist-kind">Плейлист</div>
          <h2 className="playlist-name">{data?.title || info.title}</h2>
          <p className="view-sub">{tracks.length} треков</p>
          {tracks.length > 0 && (
            <button className="btn-primary" onClick={() => player.playQueue(tracks, 0)}>
              <IconPlay size={16} /> Слушать
            </button>
          )}
        </div>
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}
      {!loading && !error && <TrackList tracks={tracks} />}
    </div>
  )
}
