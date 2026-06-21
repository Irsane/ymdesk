import React from 'react'
import { usePlayer } from '../player.jsx'
import { coverUrl, artistsStr, fmtTime } from '../api.js'
import LikeButton from './LikeButton.jsx'
import VolumeControl from './VolumeControl.jsx'
import {
  IconPlay, IconPause, IconNext, IconPrev,
  IconShuffle, IconRepeat, IconMinimize
} from './Icons.jsx'

export default function PlayerBar({ onMini }) {
  const p = usePlayer()
  const track = p.current
  const cover = coverUrl(track?.coverUri || track?.ogImage, 100)

  return (
    <div className="playerbar">
      <div className="pb-track">
        {track ? (
          <>
            <div className="pb-cover">
              {cover ? <img src={cover} alt="" /> : <div className="cover-ph">♪</div>}
            </div>
            <div className="pb-meta">
              <div className="pb-title" title={track.title}>{track.title}</div>
              <div className="pb-artist">{artistsStr(track)}</div>
            </div>
            <LikeButton track={track} />
          </>
        ) : (
          <div className="pb-empty muted">Выберите трек</div>
        )}
      </div>

      <div className="pb-center">
        <div className="pb-controls">
          <button className={`pb-btn ${p.shuffle ? 'on' : ''}`} onClick={() => p.setShuffle(s => !s)} title="Перемешать">
            <IconShuffle size={19} />
          </button>
          <button className="pb-btn" onClick={p.prev} title="Назад"><IconPrev size={22} /></button>
          <button className="pb-play" onClick={p.toggle} disabled={!track}>
            {p.loading ? <span className="spinner sm" /> : p.playing ? <IconPause size={22} /> : <IconPlay size={22} />}
          </button>
          <button className="pb-btn" onClick={p.next} title="Вперёд"><IconNext size={22} /></button>
          <button
            className={`pb-btn repeat ${p.repeatMode !== 'off' ? 'on' : ''}`}
            onClick={p.cycleRepeat}
            title={p.repeatMode === 'one' ? 'Повтор одной песни' : p.repeatMode === 'all' ? 'Повтор очереди' : 'Повтор выключен'}
          >
            <IconRepeat size={19} />
            {p.repeatMode === 'one' && <span className="repeat-one">1</span>}
          </button>
        </div>

        <div className="pb-progress">
          <span className="pb-time">{fmtTime(p.progress)}</span>
          <input
            className="seek"
            type="range" min={0} max={p.duration || 0} step={0.1}
            value={p.progress}
            onChange={(e) => p.seek(parseFloat(e.target.value))}
            style={{ '--pct': `${p.duration ? (p.progress / p.duration) * 100 : 0}%` }}
          />
          <span className="pb-time">{fmtTime(p.duration)}</span>
        </div>
        {p.error && <div className="pb-error">{p.error}</div>}
      </div>

      <div className="pb-right">
        <VolumeControl volume={p.volume} onChange={p.changeVolume} />
        <button className="icon-btn pb-mini" onClick={onMini} title="Мини-плеер">
          <IconMinimize size={18} />
        </button>
      </div>
    </div>
  )
}
