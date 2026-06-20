import React from 'react'

// Логотип Hailu — скруглённый квадрат с фирменным градиентом и
// плавной звуковой волной. animated=true добавляет мягкое «дыхание».
export default function Logo({ size = 32, animated = false }) {
  const id = React.useId()
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={`logo-svg ${animated ? 'animated' : ''}`}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a855f7" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill={`url(#g-${id})`} />
      {/* Наушники */}
      <path d="M13 31 V25 A11 11 0 0 1 35 25 V31" fill="none" stroke="#fff"
        strokeWidth="3.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="28.5" width="7" height="11.5" rx="3" fill="#fff" />
      <rect x="32" y="28.5" width="7" height="11.5" rx="3" fill="#fff" />
    </svg>
  )
}

// Текстовый логотип-словомарка.
export function Wordmark({ size = 22 }) {
  return <span className="wordmark" style={{ fontSize: size }}>Hailu</span>
}
