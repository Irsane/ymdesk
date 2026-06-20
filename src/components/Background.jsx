import React, { useEffect, useRef } from 'react'

// Анимированный фон: медленно плывущие вверх светящиеся частицы
// (что-то между снежинками и искрами) в фирменных цветах.
export default function Background() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let w, h
    const colors = ['168,85,247', '236,72,153', '139,92,246', '255,255,255']
    let particles = []

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio
      h = canvas.height = canvas.offsetHeight * devicePixelRatio
      // Плотность частиц зависит от площади.
      const count = Math.min(110, Math.floor((w * h) / (26000 * devicePixelRatio)))
      particles = Array.from({ length: count }, () => spawn(true))
    }

    const spawn = (anywhere = false) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + Math.random() * 40,
      r: (Math.random() * 2.2 + 0.6) * devicePixelRatio,
      speed: (Math.random() * 0.35 + 0.12) * devicePixelRatio,
      drift: (Math.random() - 0.5) * 0.4 * devicePixelRatio,
      phase: Math.random() * Math.PI * 2,
      sway: (Math.random() * 0.6 + 0.2) * devicePixelRatio,
      alpha: Math.random() * 0.5 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinkle: Math.random() * 0.02 + 0.005
    })

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.y -= p.speed
        p.phase += p.twinkle * 4
        p.x += p.drift + Math.sin(p.phase) * p.sway * 0.15
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.phase))

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        g.addColorStop(0, `rgba(${p.color},${a})`)
        g.addColorStop(1, `rgba(${p.color},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()

        // Ушла за верх — возрождаем снизу.
        if (p.y < -10) Object.assign(p, spawn(false))
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
  }, [])

  return (
    <div className="bg">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />
      <canvas ref={canvasRef} className="bg-canvas" />
    </div>
  )
}
