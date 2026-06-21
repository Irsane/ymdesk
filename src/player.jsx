import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { api } from './api.js'

const PlayerContext = createContext(null)
export const usePlayer = () => useContext(PlayerContext)

export function PlayerProvider({ children }) {
  // Один общий <audio> на всё приложение.
  const audioRef = useRef(null)
  if (!audioRef.current) audioRef.current = new Audio()

  // Источник правды для очереди — refs (чтобы читать актуальное в колбэках).
  const queueRef = useRef([])
  const indexRef = useRef(-1)
  const extenderRef = useRef(null)   // async () => track[] — для бесконечной волны

  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [error, setError] = useState(null)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const [shuffle, setShuffle] = useState(false)

  // Зеркала настроек в refs для чтения внутри обработчиков аудио.
  const repeatRef = useRef(repeatMode)
  const shuffleRef = useRef(shuffle)
  useEffect(() => { repeatRef.current = repeatMode }, [repeatMode])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])

  // Проиграть трек по индексу в текущей очереди.
  const playAt = useCallback(async (i) => {
    const track = queueRef.current[i]
    if (!track) return
    indexRef.current = i
    setError(null)
    setLoading(true)
    setCurrent(track)
    try {
      const id = track.id || track.trackId
      const url = await api.trackUrl(String(id))
      if (!url) throw new Error('Нет ссылки на трек')
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

  // Запустить обычную очередь треков.
  const playQueue = useCallback((tracks, startIndex = 0) => {
    const clean = (tracks || []).filter(Boolean)
    if (!clean.length) return
    queueRef.current = clean
    extenderRef.current = null
    playAt(startIndex)
  }, [playAt])

  // Запустить «Мою волну»: начальные треки + функция догрузки следующих.
  const playWave = useCallback((tracks, extender) => {
    const clean = (tracks || []).filter(Boolean)
    if (!clean.length) return
    queueRef.current = clean
    extenderRef.current = extender || null
    playAt(0)
  }, [playAt])

  // Переход к следующему треку. auto=true — вызван по окончании трека.
  const next = useCallback(async (auto = false) => {
    const audio = audioRef.current

    // Повтор одной песни — только при автопереходе.
    if (auto && repeatRef.current === 'one') {
      audio.currentTime = 0
      audio.play()
      return
    }

    const q = queueRef.current
    if (!q.length) return
    let n = shuffleRef.current ? Math.floor(Math.random() * q.length) : indexRef.current + 1

    if (n >= q.length && !shuffleRef.current) {
      // Догрузить волну, если она активна.
      if (extenderRef.current) {
        try {
          const more = await extenderRef.current()
          if (more && more.length) {
            queueRef.current = [...q, ...more]
            playAt(n)
            return
          }
        } catch { /* игнорируем — просто остановимся */ }
      }
      if (repeatRef.current === 'all') n = 0
      else { setPlaying(false); return }
    }
    playAt(n)
  }, [playAt])

  const prev = useCallback(() => {
    const audio = audioRef.current
    if (audio.currentTime > 3) { audio.currentTime = 0; return }
    const n = indexRef.current - 1
    if (n < 0) { audio.currentTime = 0; return }
    playAt(n)
  }, [playAt])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!queueRef.current.length) return
    if (audio.paused) { audio.play(); setPlaying(true) }
    else { audio.pause(); setPlaying(false) }
  }, [])

  const seek = useCallback((sec) => {
    audioRef.current.currentTime = sec
    setProgress(sec)
  }, [])

  const changeVolume = useCallback((v) => {
    audioRef.current.volume = v
    setVolume(v)
  }, [])

  // Циклическое переключение режима повтора.
  const cycleRepeat = useCallback(() => {
    setRepeatMode(m => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'))
  }, [])

  // Подписки на события <audio>.
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
    current, playing, loading, progress, duration, volume,
    error, repeatMode, shuffle,
    playQueue, playWave, toggle, next, prev, seek, changeVolume,
    cycleRepeat, setShuffle,
    isCurrent: (track) => current && (current.id || current.trackId) === (track.id || track.trackId)
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
