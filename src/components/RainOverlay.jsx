import React, { useEffect, useRef } from 'react'
import { useTheme } from '../theme.jsx'

// Летняя гроза: дождь + редкие молнии + травка по нижнему краю.
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
    let t = 0
    let flash = 0          // яркость вспышки молнии
    let nextStrike = 120   // кадров до следующей молнии
    let bolt = null        // ломаная текущей молнии
    let boltLife = 0

    const resize = () => {
      w = canvas.width = window.innerWidth * dpr
      h = canvas.height = window.innerHeight * dpr

      const dropCount = Math.min(280, Math.floor(w / dpr / 4))
      drops = Array.from({ length: dropCount }, spawnDrop)

      // Травинки вдоль всего нижнего края.
      blades = []
      const step = 9 * dpr
      for (let x = 0; x < w + step; x += step) {
        blades.push({
          x: x + (Math.random() - 0.5) * step,
          h: (Math.random() * 46 + 36) * dpr,
          lean: (Math.random() - 0.5) * 0.5,
          phase: Math.random() * Math.PI * 2,
          shade: Math.random() * 0.4 + 0.6
        })
      }
    }

    const spawnDrop = () => ({
      x: Math.random() * w,
      y: Math.random() * h - h,
      len: (Math.random() * 18 + 12) * dpr,
      speed: (Math.random() * 9 + 11) * dpr,
      alpha: Math.random() * 0.35 + 0.18
    })

    const makeBolt = () => {
      const segs = []
      let x = Math.random() * w * 0.8 + w * 0.1
      let y = 0
      const target = h * (0.4 + Math.random() * 0.3)
      segs.push([x, y])
      while (y < target) {
        y += (Math.random() * 0.08 + 0.05) * h
        x += (Math.random() - 0.5) * 0.12 * w
        segs.push([x, y])
      }
      return segs
    }

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, w, h)

      // Дождь.
      ctx.lineCap = 'round'
      for (const d of drops) {
        d.y += d.speed
        d.x += d.speed * 0.18
        ctx.strokeStyle = `rgba(170,210,255,${d.alpha})`
        ctx.lineWidth = 1.4 * dpr
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - d.len * 0.18, d.y - d.len)
        ctx.stroke()
        if (d.y > h + 20) Object.assign(d, spawnDrop(), { y: -20 })
      }

      // Молния: таймер → вспышка + ломаная.
      nextStrike -= 1
      if (nextStrike <= 0) {
        flash = Math.random() * 0.35 + 0.45
        bolt = makeBolt(); boltLife = 7
        nextStrike = Math.floor(Math.random() * 260 + 160)
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

      // Травка по нижнему краю.
      for (const b of blades) {
        const sway = Math.sin(t * 0.03 + b.phase) * 0.18 + b.lean
        const tipX = b.x + sway * b.h
        const tipY = h - b.h
        const grad = ctx.createLinearGradient(b.x, h, tipX, tipY)
        grad.addColorStop(0, `rgba(${Math.round(34 * b.shade)},${Math.round(120 * b.shade)},${Math.round(50 * b.shade)},1)`)
        grad.addColorStop(1, `rgba(${Math.round(90 * b.shade)},${Math.round(210 * b.shade)},${Math.round(110 * b.shade)},1)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 3 * dpr
        ctx.beginPath()
        ctx.moveTo(b.x, h + 2)
        ctx.quadraticCurveTo((b.x + tipX) / 2 + sway * 10 * dpr, h - b.h * 0.5, tipX, tipY)
        ctx.stroke()
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

  if (theme !== 'summer') return null
  return <canvas ref={canvasRef} className="rain-overlay" aria-hidden />
}
