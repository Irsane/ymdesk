import React, { useEffect, useState } from 'react'
import { api, coverUrl } from '../api.js'
import { usePlayer } from '../player.jsx'
import TrackList from '../components/TrackList.jsx'
import { IconPlay } from '../components/Icons.jsx'

export default function Album({ info }) {
  const [data, setData] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const player = usePlayer()

  useEffect(() => {
    setLoading(true); setError(null)
    api.album(info.album.id)
      .then(res => { setData(res.album); setTracks(res.tracks || []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [info.album.id])

  const cover = coverUrl(data?.coverUri || info.album.coverUri, 300)
  const artists = (data?.artists || info.album.artists || []).map(a => a.name).join(', ')

  return (
    <div className="view">
      <div className="playlist-header">
        <div className="playlist-cover">
          {cover ? <img src={cover} alt="" /> : <div className="cover-ph big">♪</div>}
        </div>
        <div className="playlist-info">
          <div className="playlist-kind">Альбом{data?.year ? ` · ${data.year}` : ''}</div>
          <h2 className="playlist-name">{data?.title || info.album.title}</h2>
          {artists && <p className="view-sub">{artists}</p>}
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
