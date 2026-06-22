import React from 'react'

// Знак Hailu — неоновая звуковая волна (намёк на «H») в тёмном бейдже.
const BARS = [12, 22, 16, 30, 20, 30, 16, 22, 12]

export default function Logo({ size = 32, animated = false }) {
  const id = React.useId()
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={`logo-svg ${animated ? 'animated' : ''}`}>
      <defs>
        <linearGradient id={`wave-${id}`} x1="0" y1="6" x2="0" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#4ade80" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="#13132e" />
      <g className="logo-bars" fill={`url(#wave-${id})`}>
        {BARS.map((h, i) => {
          const cx = 8 + i * 4
          return (
            <rect key={i} className="lbar" x={cx - 1.4} y={24 - h / 2}
              width="2.8" height={h} rx="1.4" style={{ animationDelay: `${i * 0.09}s` }} />
          )
        })}
      </g>
    </svg>
  )
}

// Подпись-словомарка (градиентный текст).
export function Wordmark({ size = 22 }) {
  return <span className="brand-text" style={{ fontSize: size }}>Hailu</span>
}
