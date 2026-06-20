import React, { useState } from 'react'
import { usePlayer } from '../player.jsx'
import { api, coverUrl, artistsStr, fmtTime } from '../api.js'
import { IconPlay, IconPause, IconHeart, IconHeartFilled } from './Icons.jsx'

// Универсальный список треков. tracks — массив объектов трека.
export default function TrackList({ tracks }) {
  const player = usePlayer()
  const list = (tracks || []).filter(Boolean)

  if (!list.length) return <div className="muted">Здесь пока пусто.</div>

  return (
    <div className="tracklist">
      {list.map((track, i) => (
        <TrackRow key={(track.id || track.trackId) + ':' + i}
          track={track} index={i} list={list} player={player} />
      ))}
    </div>
  )
}

function TrackRow({ track, index, list, player }) {
  const [liked, setLiked] = useState(!!track.liked)
  const active = player.isCurrent(track)
  const isPlaying = active && player.playing
  const cover = coverUrl(track.coverUri || track.ogImage, 80)

  const toggleLike = async (e) => {
    e.stopPropagation()
    const nv = !liked
    setLiked(nv)
    try { await api.like(String(track.id || track.trackId), nv) }
    catch { setLiked(!nv) }
  }

  return (
    <div
      className={`track-row ${active ? 'active' : ''}`}
      onDoubleClick={() => player.playQueue(list, index)}
    >
      <button className="track-play" onClick={() => {
        if (active) player.toggle()
        else player.playQueue(list, index)
      }}>
        <span className="track-play-icon">{isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}</span>
        {isPlaying && <span className="eq"><span /><span /><span /></span>}
      </button>

      <div className="track-cover">
        {cover ? <img src={cover} alt="" loading="lazy" /> : <div className="cover-ph">♪</div>}
      </div>

      <div className="track-main">
        <div className="track-title" title={track.title}>
          {track.title}
          {track.contentWarning && <span className="explicit">E</span>}
        </div>
        <div className="track-artist">{artistsStr(track)}</div>
      </div>

      <button className={`track-like ${liked ? 'on' : ''}`} onClick={toggleLike} title="Мне нравится">
        {liked ? <IconHeartFilled size={17} /> : <IconHeart size={17} />}
      </button>

      <div className="track-dur">{fmtTime((track.durationMs || 0) / 1000)}</div>
    </div>
  )
}
