import React, { useEffect, useState } from 'react'
import { api, coverUrl } from '../api.js'
import MyWave from '../components/MyWave.jsx'
import { IconPlay } from '../components/Icons.jsx'

function PlaylistCard({ pl, setView }) {
  const cover = coverUrl(pl.cover?.uri || pl.ogImage, 300)
  return (
    <button className="card" onClick={() => setView({ name: 'playlist', playlist: pl })}>
      <div className="card-cover">
        {cover ? <img src={cover} alt="" /> : <div className="cover-ph big">♪</div>}
        <span className="card-play" aria-hidden><IconPlay size={20} /></span>
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
      {items.map((pl, i) => <PlaylistCard key={`${pl.uid}:${pl.kind}:${i}`} pl={pl} setView={setView} />)}
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
        try { const chart = await api.chart(); if (chart?.uid && chart?.kind) p = [chart, ...p] } catch { /* */ }
        setPersonal(p)
      } catch (e) { setError(e.message) } finally { setLoading(false) }
      try { setFresh((await api.newPlaylists() || []).filter(x => x && x.title)) } catch { /* */ }
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
