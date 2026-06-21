import React, { useState, useRef } from 'react'
import { IconVolume, IconVolumeLow, IconVolumeMute } from './Icons.jsx'

// Громкость: иконка (клик = mute/unmute), слайдер и живой процент,
// который всплывает при наведении/изменении и плавно скрывается.
export default function VolumeControl({ volume, onChange, compact = false }) {
  const [show, setShow] = useState(false)
  const hideTimer = useRef(null)
  const prevVol = useRef(volume > 0 ? volume : 0.8)
  const pct = Math.round(volume * 100)

  const flash = () => {
    setShow(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShow(false), 1100)
  }
  const set = (v) => { onChange(v); flash() }

  const toggleMute = () => {
    if (volume > 0) { prevVol.current = volume; set(0) }
    else set(prevVol.current || 0.8)
  }

  const Icon = volume === 0 ? IconVolumeMute : volume < 0.5 ? IconVolumeLow : IconVolume

  return (
    <div className={`volume ${compact ? 'compact' : ''}`}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button className="pb-btn vol-btn" onClick={toggleMute} title={volume === 0 ? 'Включить звук' : 'Выключить звук'}>
        <Icon size={18} />
      </button>
      <div className="vol-wrap">
        <span className={`vol-pct ${show ? 'show' : ''}`}>{pct}%</span>
        <input className="vol" type="range" min={0} max={1} step={0.01} value={volume}
          onChange={(e) => set(parseFloat(e.target.value))}
          style={{ '--pct': `${pct}%` }} aria-label={`Громкость ${pct}%`} />
      </div>
    </div>
  )
}
