import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { api } from './api.js'

const PlayerContext = createContext(null)
export const usePlayer = () => useContext(PlayerContext)

export function PlayerProvider({ children }) {
  // Один общий <audio> на всё приложение.
  const audioRef = useRef(null)
  if (!audioRef.current) audioRef.current = new Audio()

  const [queue, setQueue] = useState([])      // массив треков
  const [index, setIndex] = useState(-1)      // позиция в очереди
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0) // секунды
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [error, setError] = useState(null)
  const [repeat, setRepeat] = useState(false)
  const [shuffle, setShuffle] = useState(false)

  // Загружает прямую ссылку и запускает воспроизведение трека по индексу.
  const playIndex = useCallback(async (q, i) => {
    const track = q[i]
    if (!track) return
    setError(null)
    setLoading(true)
    setCurrent(track)
    setIndex(i)
    setQueue(q)
    try {
      const id = track.id || track.trackId
      const url = await api.trackUrl(String(id))
      const audio = audioRef.current
      audio.src = url
      await audio.play()
      setPlaying(true)
    } catch (e) {
      setError(e.message || 'Не удалось воспроизвести трек')
      setPlaying(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Запустить очередь треков с конкретного индекса.
  const playQueue = useCallback((tracks, startIndex = 0) => {
    const clean = (tracks || []).filter(Boolean)
    if (!clean.length) return
    playIndex(clean, startIndex)
  }, [playIndex])

  const next = useCallback(() => {
    setQueue(q => {
      setIndex(i => {
        if (!q.length) return i
        let n
        if (shuffle) n = Math.floor(Math.random() * q.length)
        else n = i + 1
        if (n >= q.length) {
          if (repeat) n = 0
          else return i
        }
        playIndex(q, n)
        return n
      })
      return q
    })
  }, [playIndex, shuffle, repeat])

  const prev = useCallback(() => {
    const audio = audioRef.current
    if (audio.currentTime > 3) { audio.currentTime = 0; return }
    setQueue(q => {
      setIndex(i => {
        const n = i - 1
        if (n < 0) { audio.currentTime = 0; return i }
        playIndex(q, n)
        return n
      })
      return q
    })
  }, [playIndex])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!current) return
    if (audio.paused) { audio.play(); setPlaying(true) }
    else { audio.pause(); setPlaying(false) }
  }, [current])

  const seek = useCallback((sec) => {
    audioRef.current.currentTime = sec
    setProgress(sec)
  }, [])

  const changeVolume = useCallback((v) => {
    audioRef.current.volume = v
    setVolume(v)
  }, [])

  // Подписки на события <audio>.
  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume
    const onTime = () => setProgress(audio.currentTime)
    const onDur = () => setDuration(audio.duration || 0)
    const onEnd = () => next()
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDur)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDur)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [next]) // eslint-disable-line react-hooks/exhaustive-deps

  // Горячие клавиши: пробел — пауза/плей.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault(); toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  const value = {
    queue, index, current, playing, loading, progress, duration, volume,
    error, repeat, shuffle,
    playQueue, toggle, next, prev, seek, changeVolume,
    setRepeat, setShuffle,
    isCurrent: (track) => current && (current.id || current.trackId) === (track.id || track.trackId)
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
