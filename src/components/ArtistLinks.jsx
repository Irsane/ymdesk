import React from 'react'
import { useNav } from '../nav.jsx'

// Имена артистов трека в виде кликабельных ссылок на страницу артиста.
export default function ArtistLinks({ track, fallback = 'Неизвестный исполнитель' }) {
  const navigate = useNav()
  const artists = (track?.artists || []).filter(a => a && a.name)
  if (!artists.length) return <span>{fallback}</span>

  return artists.map((a, i) => (
    <React.Fragment key={a.id || i}>
      {i > 0 && ', '}
      {a.id && !a.various ? (
        <button
          className="artist-link"
          onClick={(e) => { e.stopPropagation(); navigate({ name: 'artist', artistId: a.id, artistName: a.name }) }}
        >{a.name}</button>
      ) : <span>{a.name}</span>}
    </React.Fragment>
  ))
}
