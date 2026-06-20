import React, { useEffect, useState, useCallback } from 'react'
import { api, coverUrl } from '../api.js'
import { usePlayer } from '../player.jsx'
import MyWave from '../components/MyWave.jsx'
import { IconPlay } from '../components/Icons.jsx'

function PlaylistCard({ pl, setView }) {
  const cover = coverUrl(pl.cover?.uri || pl.cover || pl.ogImage, 300)
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
      {items.map((pl, i) => <PlaylistCard key={`${pl.uid || pl.ownerId}:${pl.kind}:${i}`} pl={pl} setView={setView} />)}
    </div>
  )
}

// --- Главная VK ---
function VkHome({ setView }) {
  const player = usePlayer()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [recLoading, setRecLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try { setPlaylists(await api.vkPlaylists()) }
      catch (e) { setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [])

  const playMyMusic = useCallback(async () => {
    setRecLoading(true)
    try {
      const tracks = await api.vkAudios()
      if (tracks.length) player.playQueue(tracks, 0)
    } catch { /* ignore */ } finally { setRecLoading(false) }
  }, [player])

  return (
    <div className="view">
      <section className="wave">
        <div className="wave-orb" aria-hidden><span /><span /><span /></div>
        <div className="wave-body">
          <div className="wave-head">
            <h2 className="wave-title">Моя музыка VK</h2>
            <p className="wave-sub">Все ваши сохранённые треки одним потоком</p>
          </div>
          <button className="wave-play" onClick={playMyMusic} disabled={recLoading}>
            {recLoading ? <span className="spinner sm" /> : <IconPlay size={18} />} Слушать
          </button>
        </div>
      </section>

      <h2 className="view-title section-gap">Ваши плейлисты</h2>
      <p className="view-sub">Плейлисты из вашего VK</p>
      {loading && <div className="spinner" />}
      {error && <div className="error-box">{error}</div>}
      {!loading && !error && <Grid items={playlists} setView={setView} />}
      {!loading && !error && !playlists.length && <div className="muted">Плейлисты не найдены.</div>}
    </div>
  )
}

// --- Главная Яндекс ---
function YaHome({ setView }) {
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

export default function Home({ source, setView }) {
  return source === 'vk' ? <VkHome setView={setView} /> : <YaHome setView={setView} />
}
