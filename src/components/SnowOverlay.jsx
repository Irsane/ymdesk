import React, { useEffect, useRef } from 'react'
import { useTheme } from '../theme.jsx'

// Настоящие снежинки (глифы) поверх ВСЕГО приложения — только в теме «снежная».
const GLYPHS = ['❄', '❅', '❆', '✻', '❉']

export default function SnowOverlay() {
  const { theme } = useTheme()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (theme !== 'snow') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf, w, h, flakes = []

    const resize = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio
      h = canvas.height = window.innerHeight * devicePixelRatio
      const count = Math.min(140, Math.floor((w * h) / (34000 * devicePixelRatio)))
      flakes = Array.from({ length: count }, () => spawn(true))
    }

    const spawn = (anywhere = false) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -20,
      size: (Math.random() * 14 + 9) * devicePixelRatio,
      speed: (Math.random() * 0.8 + 0.4) * devicePixelRatio,
      drift: (Math.random() - 0.5) * 0.8 * devicePixelRatio,
      sway: Math.random() * 0.9 + 0.3,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      rot: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.5 + 0.45,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    })

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const f of flakes) {
        f.y += f.speed
        f.phase += 0.01
        f.x += f.drift + Math.sin(f.phase) * f.sway * devicePixelRatio
        f.rot += f.spin

        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate(f.rot)
        ctx.globalAlpha = f.alpha
        ctx.fillStyle = '#eaf4ff'
        ctx.shadowColor = 'rgba(150,200,255,.9)'
        ctx.shadowBlur = 8 * devicePixelRatio
        ctx.font = `${f.size}px serif`
        ctx.fillText(f.glyph, 0, 0)
        ctx.restore()

        if (f.y > h + 24) Object.assign(f, spawn(false))
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
  }, [theme])

  if (theme !== 'snow') return null
  return <canvas ref={canvasRef} className="snow-overlay" aria-hidden />
}
