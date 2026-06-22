import React, { useEffect, useState } from 'react'
import { api, coverUrl } from '../api.js'
import { usePlayer } from '../player.jsx'
import TrackList from '../components/TrackList.jsx'
import { IconPlay } from '../components/Icons.jsx'

function fmtCount(n) {
  if (!n) return null
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.0', '') + ' млн'
  if (n >= 1e3) return Math.round(n / 1e3) + ' тыс.'
  return String(n)
}

export default function Artist({ info, setView }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const player = usePlayer()

  useEffect(() => {
    setLoading(true); setError(null); setData(null); setShowAll(false)
    api.artist(info.artistId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [info.artistId])

  const artist = data?.artist
  const cover = coverUrl(artist?.cover?.uri || artist?.ogImage, 400)
  const popular = data?.popularTracks || []
  const albums = data?.albums || []
  // ratings.month — это позиция в чарте, а не число слушателей; показываем
  // реальные счётчики: поклонники (лайки артиста), треки, альбомы.
  const fans = fmtCount(artist?.likesCount)
  const shown = showAll ? popular : popular.slice(0, 10)

  return (
    <div className="view">
      <div className="artist-header">
        <div className="artist-cover">
          {cover ? <img src={cover} alt="" /> : <div className="cover-ph big">♪</div>}
        </div>
        <div className="artist-info">
          <div className="playlist-kind">Исполнитель</div>
          <h2 className="playlist-name">{artist?.name || info.artistName}</h2>
          <div className="artist-stats">
            {fans && <span>{fans} поклонников</span>}
            {artist?.counts?.tracks ? <span>{artist.counts.tracks} треков</span> : null}
            {artist?.counts?.directAlbums ? <span>{artist.counts.directAlbums} альбомов</span> : null}
          </div>
          {popular.length > 0 && (
            <button className="btn-primary" onClick={() => player.playQueue(popular, 0)}>
              <IconPlay size={16} /> Слушать
            </button>
          )}
        </div>
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}

      {!loading && popular.length > 0 && (
        <>
          <h3 className="view-title section-gap subtitle">Популярные треки</h3>
          <TrackList tracks={shown} />
          {popular.length > 10 && (
            <button className="show-more" onClick={() => setShowAll(v => !v)}>
              {showAll ? 'Свернуть' : `Показать все (${popular.length})`}
            </button>
          )}
        </>
      )}

      {!loading && albums.length > 0 && (
        <>
          <h3 className="view-title section-gap subtitle">Альбомы</h3>
          <div className="card-grid">
            {albums.map(al => {
              const ac = coverUrl(al.coverUri, 300)
              return (
                <button key={al.id} className="card" onClick={() => setView({ name: 'album', album: al })}>
                  <div className="card-cover">
                    {ac ? <img src={ac} alt="" /> : <div className="cover-ph big">♪</div>}
                    <span className="card-play" aria-hidden><IconPlay size={20} /></span>
                  </div>
                  <div className="card-title">{al.title}</div>
                  <div className="card-sub">{al.year || 'Альбом'}</div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {!loading && !error && !popular.length && !albums.length && (
        <div className="muted section-gap">У этого исполнителя пока нет данных.</div>
      )}
    </div>
  )
}
