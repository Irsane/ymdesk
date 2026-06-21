import React from 'react'

// Фон: мягкие плывущие цветные пятна (glow). Частицы — в ParticleOverlay.
export default function Background() {
  return (
    <div className="bg">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />
    </div>
  )
}
