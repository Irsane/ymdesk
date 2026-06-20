import React from 'react'
import { usePlayer } from '../player.jsx'
import { coverUrl, artistsStr } from '../api.js'
import { IconPlay, IconPause, IconNext, IconPrev, IconVolume, IconExpand } from './Icons.jsx'

// Компактный плеер для мини-режима окна.
export default function MiniPlayer({ onRestore }) {
  const p = usePlayer()
  const track = p.current
  const cover = coverUrl(track?.coverUri || track?.ogImage, 100)

  return (
    <div className="mini">
      <div className="mini-cover">
        {cover ? <img src={cover} alt="" /> : <div className="cover-ph">♪</div>}
      </div>

      <div className="mini-meta">
        <div className="mini-title" title={track?.title}>{track?.title || 'Hailu'}</div>
        <div className="mini-artist">{track ? artistsStr(track) : 'Выберите трек'}</div>
      </div>

      <div className="mini-controls">
        <button className="pb-btn" onClick={p.prev} title="Назад"><IconPrev size={20} /></button>
        <button className="pb-play sm" onClick={p.toggle} disabled={!track}>
          {p.loading ? <span className="spinner sm" /> : p.playing ? <IconPause size={18} /> : <IconPlay size={18} />}
        </button>
        <button className="pb-btn" onClick={p.next} title="Вперёд"><IconNext size={20} /></button>
      </div>

      <div className="mini-vol">
        <IconVolume size={16} />
        <input
          type="range" min={0} max={1} step={0.01} value={p.volume}
          onChange={(e) => p.changeVolume(parseFloat(e.target.value))}
          style={{ '--pct': `${p.volume * 100}%` }}
        />
      </div>

      <button className="icon-btn mini-restore" onClick={onRestore} title="Вернуть полный размер">
        <IconExpand size={18} />
      </button>
    </div>
  )
}
