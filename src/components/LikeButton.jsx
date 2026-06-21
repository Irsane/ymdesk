import React, { useState, useEffect } from 'react'
import { api } from '../api.js'
import { IconHeart, IconHeartFilled } from './Icons.jsx'

// Кнопка лайка текущего трека (добавить/убрать из «Мне нравится»).
export default function LikeButton({ track, size = 18 }) {
  const [liked, setLiked] = useState(!!track?.liked)
  useEffect(() => { setLiked(!!track?.liked) }, [track])

  if (!track) return null

  const toggle = async () => {
    const nv = !liked
    setLiked(nv)
    try { await api.like(String(track.id || track.trackId), nv) }
    catch { setLiked(!nv) }
  }

  return (
    <button className={`pb-btn like ${liked ? 'on' : ''}`} onClick={toggle}
      title={liked ? 'Убрать из «Мне нравится»' : 'Добавить в «Мне нравится»'}>
      {liked ? <IconHeartFilled size={size} /> : <IconHeart size={size} />}
    </button>
  )
}
