import React, { useEffect, useRef } from 'react'
import { useTheme } from '../theme.jsx'
import { useSettings } from '../settings.jsx'

// Частицы поверх всего приложения — свои для каждой темы.
const CONFIG = {
  // Тёмная — парящие вверх музыкальные нотки.
  dark: {
    glyphs: ['♪', '♫', '♬', '♩'], colors: ['168,85,247', '236,72,153', '139,92,246'],
    dir: -1, sizeMin: 11, sizeMax: 24, density: 30000, alphaMin: 0.2, alphaMax: 0.5,
    speedMin: 0.2, speedMax: 0.5, sway: 0.5, spin: 0.01, glow: 8
  },
  // Супер тёмная — мерцающие звёздочки.
  superdark: {
    glyphs: ['✦', '✧', '·', '✺'], colors: ['255,255,255', '200,210,255'],
    dir: -1, sizeMin: 8, sizeMax: 18, density: 26000, alphaMin: 0.25, alphaMax: 0.7,
    speedMin: 0.08, speedMax: 0.28, sway: 0.3, spin: 0.004, glow: 10, twinkle: true
  },
  // Светлая — лёгкие пузырьки/кружочки.
  light: {
    glyphs: ['○', '◦', '°'], colors: ['168,85,247', '236,72,153', '99,102,241'],
    dir: -1, sizeMin: 9, sizeMax: 22, density: 30000, alphaMin: 0.12, alphaMax: 0.32,
    speedMin: 0.18, speedMax: 0.45, sway: 0.6, spin: 0.006, glow: 4
  },
  // Снежная — падающие снежинки.
  snow: {
    glyphs: ['❄', '❅', '❆', '❉'], colors: ['234,244,255', '205,225,255'],
    dir: 1, sizeMin: 10, sizeMax: 22, density: 22000, alphaMin: 0.35, alphaMax: 0.85,
    speedMin: 0.5, speedMax: 1.1, sway: 0.7, spin: 0.012, glow: 8
  }
}

export default function ParticleOverlay() {
  const { theme } = useTheme()
  const { bgAnim } = useSettings()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!bgAnim) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const cfg = CONFIG[theme] || CONFIG.dark
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = devicePixelRatio
    let raf, w, h, items = [], t = 0

    const spawn = (anywhere = false) => {
      const fromTop = cfg.dir > 0
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : (fromTop ? -20 : h + 20),
        size: (Math.random() * (cfg.sizeMax - cfg.sizeMin) + cfg.sizeMin) * dpr,
        speed: (Math.random() * (cfg.speedMax - cfg.speedMin) + cfg.speedMin) * dpr,
        drift: (Math.random() - 0.5) * cfg.sway * dpr,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * cfg.spin,
        alpha: Math.random() * (cfg.alphaMax - cfg.alphaMin) + cfg.alphaMin,
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        glyph: cfg.glyphs[Math.floor(Math.random() * cfg.glyphs.length)]
      }
    }

    const resize = () => {
      w = canvas.width = window.innerWidth * dpr
      h = canvas.height = window.innerHeight * dpr
      const count = Math.min(150, Math.floor((w * h) / (cfg.density * dpr)))
      items = Array.from({ length: count }, () => spawn(true))
    }

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, w, h)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const p of items) {
        p.y += cfg.dir * p.speed
        p.phase += 0.02
        p.x += p.drift + Math.sin(p.phase) * cfg.sway * dpr * 0.4
        p.rot += p.spin
        let a = p.alpha
        if (cfg.twinkle) a *= 0.5 + 0.5 * Math.sin(p.phase * 2)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, a)
        ctx.fillStyle = `rgb(${p.color})`
        ctx.shadowColor = `rgba(${p.color},0.9)`
        ctx.shadowBlur = cfg.glow * dpr
        ctx.font = `${p.size}px serif`
        ctx.fillText(p.glyph, 0, 0)
        ctx.restore()

        const out = cfg.dir > 0 ? p.y > h + 30 : p.y < -30
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

  if (!bgAnim) return null
  return <canvas ref={canvasRef} className="particle-overlay" aria-hidden />
}
