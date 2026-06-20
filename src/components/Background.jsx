import React, { useEffect, useRef } from 'react'
import { useTheme } from '../theme.jsx'
import { useSettings } from '../settings.jsx'

// Конфиг частиц под каждое оформление.
const CONFIG = {
  dark:      { colors: ['168,85,247', '236,72,153', '139,92,246', '255,255,255'], dir: -1, density: 26000, sizeMax: 2.2, snow: false },
  superdark: { colors: ['168,85,247', '236,72,153', '255,255,255'], dir: -1, density: 32000, sizeMax: 1.8, snow: false },
  light:     { colors: ['168,85,247', '236,72,153', '99,102,241'], dir: -1, density: 34000, sizeMax: 2, snow: false },
  snow:      { colors: ['255,255,255', '210,230,255', '190,210,255'], dir: 1, density: 14000, sizeMax: 3, snow: true }
}

export default function Background() {
  const { theme } = useTheme()
  const { bgAnim } = useSettings()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!bgAnim) return
    const cfg = CONFIG[theme] || CONFIG.dark
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, w, h, particles = []

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio
      h = canvas.height = canvas.offsetHeight * devicePixelRatio
      const count = Math.min(160, Math.floor((w * h) / (cfg.density * devicePixelRatio)))
      particles = Array.from({ length: count }, () => spawn(true))
    }

    const spawn = (anywhere = false) => {
      const fromTop = cfg.dir > 0
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : (fromTop ? -10 : h + Math.random() * 40),
        r: (Math.random() * cfg.sizeMax + 0.6) * devicePixelRatio,
        speed: (Math.random() * (cfg.snow ? 0.6 : 0.35) + 0.12) * devicePixelRatio,
        drift: (Math.random() - 0.5) * (cfg.snow ? 0.7 : 0.4) * devicePixelRatio,
        phase: Math.random() * Math.PI * 2,
        sway: (Math.random() * 0.6 + 0.2) * devicePixelRatio,
        alpha: Math.random() * (cfg.snow ? 0.6 : 0.5) + (cfg.snow ? 0.3 : 0.15),
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        twinkle: Math.random() * 0.02 + 0.005
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.y += cfg.dir * p.speed
        p.phase += p.twinkle * 4
        p.x += p.drift + Math.sin(p.phase) * p.sway * (cfg.snow ? 0.4 : 0.15)

        if (cfg.snow) {
          // Плотная «снежинка»: ядро + мягкое гало.
          ctx.fillStyle = `rgba(${p.color},${p.alpha})`
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
          g.addColorStop(0, `rgba(${p.color},${p.alpha * 0.4})`)
          g.addColorStop(1, `rgba(${p.color},0)`)
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill()
        } else {
          const a = p.alpha * (0.6 + 0.4 * Math.sin(p.phase))
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
          g.addColorStop(0, `rgba(${p.color},${a})`)
          g.addColorStop(1, `rgba(${p.color},0)`)
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill()
        }

        const out = cfg.dir > 0 ? p.y > h + 12 : p.y < -12
        if (out) Object.assign(p, spawn(false))
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [theme, bgAnim])

  return (
    <div className="bg">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />
      {bgAnim && <canvas ref={canvasRef} className="bg-canvas" />}
    </div>
  )
}
