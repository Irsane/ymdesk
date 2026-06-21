import React from 'react'
import { usePlayer } from '../player.jsx'
import { coverUrl, artistsStr } from '../api.js'
import LikeButton from './LikeButton.jsx'
import VolumeControl from './VolumeControl.jsx'
import { IconPlay, IconPause, IconNext, IconPrev, IconExpand } from './Icons.jsx'

// Компактный плеер для мини-режима окна. shape: 'rect' | 'square'.
export default function MiniPlayer({ shape = 'rect', onRestore }) {
  const p = usePlayer()
  const track = p.current
  const cover = coverUrl(track?.coverUri || track?.ogImage, shape === 'square' ? 300 : 100)

  const Controls = (
    <div className="mini-controls">
      <LikeButton track={track} size={18} />
      <button className="pb-btn" onClick={p.prev} title="Назад"><IconPrev size={20} /></button>
      <button className="pb-play sm" onClick={p.toggle} disabled={!track}>
        {p.loading ? <span className="spinner sm" /> : p.playing ? <IconPause size={18} /> : <IconPlay size={18} />}
      </button>
      <button className="pb-btn" onClick={p.next} title="Вперёд"><IconNext size={20} /></button>
    </div>
  )

  if (shape === 'square') {
    return (
      <div className="mini square">
        <button className="icon-btn mini-restore" onClick={onRestore} title="Вернуть полный размер"><IconExpand size={18} /></button>
        <div className="mini-cover-lg">
          {cover ? <img src={cover} alt="" /> : <div className="cover-ph">♪</div>}
        </div>
        <div className="mini-meta center">
          <div className="mini-title" title={track?.title}>{track?.title || 'Hailu'}</div>
          <div className="mini-artist">{track ? artistsStr(track) : 'Выберите трек'}</div>
        </div>
        {Controls}
        <VolumeControl volume={p.volume} onChange={p.changeVolume} />
      </div>
    )
  }

  return (
    <div className="mini">
      <div className="mini-cover">
        {cover ? <img src={cover} alt="" /> : <div className="cover-ph">♪</div>}
      </div>
      <div className="mini-meta">
        <div className="mini-title" title={track?.title}>{track?.title || 'Hailu'}</div>
        <div className="mini-artist">{track ? artistsStr(track) : 'Выберите трек'}</div>
      </div>
      {Controls}
      <VolumeControl volume={p.volume} onChange={p.changeVolume} compact />
      <button className="icon-btn mini-restore" onClick={onRestore} title="Вернуть полный размер">
        <IconExpand size={18} />
      </button>
    </div>
  )
}
