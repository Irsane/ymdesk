import React, { useEffect, useState } from 'react'
import { coverUrl } from '../api.js'
import { api } from '../api.js'
import MyWave from '../components/MyWave.jsx'

// Карточка плейлиста.
function PlaylistCard({ pl, setView }) {
  const cover = coverUrl(pl.cover?.uri || pl.ogImage, 300)
  return (
    <button className="card" onClick={() => setView({ name: 'playlist', playlist: pl })}>
      <div className="card-cover">
        {cover ? <img src={cover} alt="" /> : <div className="cover-ph big">♪</div>}
      </div>
      <div className="card-title">{pl.title}</div>
      <div className="card-sub">{pl.trackCount ? `${pl.trackCount} треков` : 'Плейлист'}</div>
    </button>
  )
}

function Grid({ items, setView }) {
  if (!items.length) return null
  return (
    <div className="card-grid">
      {items.map(pl => <PlaylistCard key={`${pl.uid}:${pl.kind}`} pl={pl} setView={setView} />)}
    </div>
  )
}

export default function Home({ setView }) {
  const [personal, setPersonal] = useState([])
  const [fresh, setFresh] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const feed = await api.feed()
        let p = (feed.generatedPlaylists || []).map(g => g.data).filter(Boolean)
        // Чарт как первая карточка, если доступен.
        try {
          const chart = await api.chart()
          if (chart?.uid && chart?.kind) p = [chart, ...p]
        } catch { /* без чарта */ }
        setPersonal(p)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
      // Новые плейлисты — отдельной секцией, не блокируют основную.
      try {
        const np = await api.newPlaylists()
        setFresh((np || []).filter(x => x && x.title))
      } catch { /* пропускаем */ }
    })()
  }, [])

  return (
    <div className="view">
      <MyWave />

      <h2 className="view-title section-gap">Подборки для вас</h2>
      <p className="view-sub">Персональные плейлисты на каждый день</p>
      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}
      {!loading && !error && <Grid items={personal} setView={setView} />}
      {!loading && !error && !personal.length && <div className="muted">Подборки не найдены.</div>}

      {fresh.length > 0 && (
        <>
          <h2 className="view-title section-gap">Новые плейлисты</h2>
          <p className="view-sub">Свежие подборки редакции Яндекс Музыки</p>
          <Grid items={fresh} setView={setView} />
        </>
      )}
    </div>
  )
}
