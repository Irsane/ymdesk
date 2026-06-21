import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { api } from './api.js'
import { Queue, idOf } from './queueEngine.js'

const PlayerContext = createContext(null)
export const usePlayer = () => useContext(PlayerContext)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  if (!audioRef.current) audioRef.current = new Audio()
  const qRef = useRef(null)
  if (!qRef.current) qRef.current = new Queue()

  const loadTokenRef = useRef(0)     // отсекает устаревшие загрузки
  const intendPlayRef = useRef(false) // хотим ли мы сейчас играть (для паузы)
  const extendingRef = useRef(false)  // идёт фоновая догрузка волны

  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [error, setError] = useState(null)
  const [repeatMode, setRepeatMode] = useState('off') // off | all | one
  const [shuffle, setShuffle] = useState(false)

  const repeatRef = useRef(repeatMode); useEffect(() => { repeatRef.current = repeatMode }, [repeatMode])
  const shuffleRef = useRef(shuffle); useEffect(() => { shuffleRef.current = shuffle }, [shuffle])

  // Фоновая догрузка следующей пачки волны.
  const prefetch = useCallback(() => {
    const q = qRef.current
    if (!q.needsPrefetch() || extendingRef.current || !q.extender) return
    extendingRef.current = true
    Promise.resolve(q.extender())
      .then(more => { q.append(more) })
      .catch(() => {})
      .finally(() => { extendingRef.current = false })
  }, [])

  // Проиграть трек по индексу очереди.
  const playAt = useCallback(async (i) => {
    const q = qRef.current
    q.setIndex(i)
    const track = q.current()
    if (!track) return
    const token = ++loadTokenRef.current
    intendPlayRef.current = true
    setError(null); setLoading(true); setCurrent(track)
    prefetch()
    try {
      const url = await api.trackUrl(String(track.id || track.trackId))
      if (token !== loadTokenRef.current) return
      if (!url) throw new Error('Нет ссылки на трек')
      const audio = audioRef.current
      audio.src = url
      if (!intendPlayRef.current) { setLoading(false); return } // успели нажать паузу
      try { await audio.play() } catch (err) {
        if (err.name === 'AbortError' || token !== loadTokenRef.current) return
        throw err
      }
      if (token === loadTokenRef.current) setPlaying(true)
    } catch (e) {
      if (token === loadTokenRef.current) { setError(e.message || 'Не удалось воспроизвести'); setPlaying(false) }
    } finally {
      if (token === loadTokenRef.current) setLoading(false)
    }
  }, [prefetch])

  const playQueue = useCallback((tracks, startIndex = 0) => {
    const clean = (tracks || []).filter(Boolean)
    if (!clean.length) return
    qRef.current.setList(clean, null)
    extendingRef.current = false
    playAt(startIndex)
  }, [playAt])

  const playWave = useCallback((tracks, extender) => {
    const clean = (tracks || []).filter(Boolean)
    if (!clean.length) return
    qRef.current.setList(clean, extender)
    extendingRef.current = false
    playAt(0)
  }, [playAt])

  const next = useCallback(async (auto = false) => {
    const audio = audioRef.current
    const q = qRef.current
    if (auto && repeatRef.current === 'one') { audio.currentTime = 0; audio.play(); return }

    let n = q.peekNext({ shuffle: shuffleRef.current, repeat: repeatRef.current })
    if (n === null && q.extender) {
      // Очередь кончилась — добираем (на случай, если префетч не успел).
      try {
        const more = await q.extender()
        q.append(more)
        n = q.peekNext({ shuffle: shuffleRef.current, repeat: repeatRef.current })
      } catch { /* */ }
    }
    if (n === null) { intendPlayRef.current = false; setPlaying(false); return }
    playAt(n)
  }, [playAt])

  const prev = useCallback(() => {
    const audio = audioRef.current
    if (audio.currentTime > 3) { audio.currentTime = 0; return }
    playAt(qRef.current.peekPrev())
  }, [playAt])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!qRef.current.current()) return
    if (audio.paused) { intendPlayRef.current = true; audio.play().catch(() => {}) }
    else { intendPlayRef.current = false; audio.pause() }
  }, [])

  const seek = useCallback((sec) => { audioRef.current.currentTime = sec; setProgress(sec) }, [])
  const changeVolume = useCallback((v) => { audioRef.current.volume = v; setVolume(v) }, [])
  const cycleRepeat = useCallback(() => setRepeatMode(m => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off')), [])

  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume
    const onTime = () => setProgress(audio.currentTime)
    const onDur = () => setDuration(audio.duration || 0)
    const onEnd = () => next(true)
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

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  const value = {
    current, playing, loading, progress, duration, volume,
    error, repeatMode, shuffle,
    playQueue, playWave, toggle, next, prev, seek, changeVolume,
    cycleRepeat, setShuffle,
    isCurrent: (track) => current && idOf(current) === idOf(track)
  }
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
