import React, { useEffect, useRef } from 'react'
import { useTheme } from '../theme.jsx'

// Летняя гроза: дождь + редкие молнии + густая трава по нижнему краю.
// Только в теме «летняя». Рисуется поверх всего приложения.
export default function RainOverlay() {
  const { theme } = useTheme()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (theme !== 'summer') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = devicePixelRatio
    let raf, w, h, drops = [], blades = []
    let t = 0, flash = 0, nextStrike = 140, bolt = null, boltLife = 0

    const spawnDrop = () => ({
      x: Math.random() * w,
      y: Math.random() * -h,
      len: (Math.random() * 16 + 12) * dpr,
      speed: (Math.random() * 9 + 12) * dpr,
      alpha: Math.random() * 0.3 + 0.15
    })

    const buildGrass = () => {
      blades = []
      const step = 4.5 * dpr
      for (let x = -step; x < w + step; x += step * (0.55 + Math.random() * 0.7)) {
        const back = Math.random() < 0.5
        blades.push({
          x,
          back,
          w: (Math.random() * 4 + 4.5) * dpr,
          h: (Math.random() * 48 + (back ? 60 : 38)) * dpr,
          bend: (Math.random() - 0.5) * 34 * dpr,
          phase: Math.random() * Math.PI * 2,
          hue: 95 + Math.random() * 35,
          light: (back ? 22 : 34) + Math.random() * 14
        })
      }
      // Дальние травинки рисуем первыми (глубина).
      blades.sort((a, b) => (a.back === b.back ? 0 : a.back ? -1 : 1))
    }

    const resize = () => {
      w = canvas.width = window.innerWidth * dpr
      h = canvas.height = window.innerHeight * dpr
      drops = Array.from({ length: Math.min(280, Math.floor(w / dpr / 4)) }, spawnDrop)
      buildGrass()
    }

    const makeBolt = () => {
      const segs = []
      let x = Math.random() * w * 0.8 + w * 0.1, y = 0
      const target = h * (0.4 + Math.random() * 0.3)
      segs.push([x, y])
      while (y < target) {
        y += (Math.random() * 0.08 + 0.05) * h
        x += (Math.random() - 0.5) * 0.12 * w
        segs.push([x, y])
      }
      return segs
    }

    const drawBlade = (b) => {
      const sway = Math.sin(t * 0.018 + b.phase) * 9 * dpr + (flash > 0 ? 0 : 0)
      const baseY = h + 2
      const tipX = b.x + b.bend + sway
      const tipY = baseY - b.h
      const hw = b.w / 2
      const cx = (b.x + tipX) / 2
      const g = ctx.createLinearGradient(b.x, baseY, tipX, tipY)
      g.addColorStop(0, `hsl(${b.hue} 60% ${b.light * 0.55}%)`)
      g.addColorStop(1, `hsl(${b.hue} 70% ${b.light + 14}%)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(b.x - hw, baseY)
      ctx.quadraticCurveTo(cx - hw * 0.6, baseY - b.h * 0.55, tipX, tipY)
      ctx.quadraticCurveTo(cx + hw * 0.6, baseY - b.h * 0.55, b.x + hw, baseY)
      ctx.closePath()
      ctx.fill()
    }

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, w, h)

      // Дождь.
      ctx.lineCap = 'round'
      ctx.lineWidth = 1.4 * dpr
      for (const d of drops) {
        d.y += d.speed
        d.x += d.speed * 0.18
        ctx.strokeStyle = `rgba(175,212,255,${d.alpha})`
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - d.len * 0.18, d.y - d.len)
        ctx.stroke()
        if (d.y > h + 20) Object.assign(d, spawnDrop(), { y: -20 })
      }

      // Молния.
      if (--nextStrike <= 0) {
        flash = Math.random() * 0.35 + 0.4
        bolt = makeBolt(); boltLife = 7
        nextStrike = Math.floor(Math.random() * 280 + 160)
      }
      if (flash > 0) {
        ctx.fillStyle = `rgba(210,225,255,${flash})`
        ctx.fillRect(0, 0, w, h)
        flash -= 0.06
      }
      if (bolt && boltLife > 0) {
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, boltLife / 6)})`
        ctx.lineWidth = 2.6 * dpr
        ctx.shadowColor = 'rgba(190,210,255,.9)'
        ctx.shadowBlur = 16 * dpr
        ctx.beginPath()
        ctx.moveTo(bolt[0][0], bolt[0][1])
        for (let i = 1; i < bolt.length; i++) ctx.lineTo(bolt[i][0], bolt[i][1])
        ctx.stroke()
        ctx.shadowBlur = 0
        boltLife -= 1
      }

      // Земля + трава.
      const gh = 70 * dpr
      const gg = ctx.createLinearGradient(0, h - gh, 0, h)
      gg.addColorStop(0, 'rgba(10,38,20,0)')
      gg.addColorStop(1, 'rgba(7,28,15,.6)')
      ctx.fillStyle = gg
      ctx.fillRect(0, h - gh, w, gh)
      for (const b of blades) drawBlade(b)

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

  if (theme !== 'summer') return null
  return <canvas ref={canvasRef} className="rain-overlay" aria-hidden />
}
