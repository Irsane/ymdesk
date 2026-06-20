import React from 'react'

// Знак Hailu — монограмма «H» в скруглённом бейдже с фирменным градиентом.
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
      {/* Монограмма H */}
      <g fill="#fff">
        <rect x="14" y="13" width="5.4" height="22" rx="2.7" />
        <rect x="28.6" y="13" width="5.4" height="22" rx="2.7" />
        <rect x="16" y="21.3" width="16" height="5.4" rx="2.7" />
      </g>
      {/* акцент-нотка */}
      <circle cx="34" cy="14" r="3.1" fill="#fff" />
    </svg>
  )
}

// Подпись-словомарка (градиентный текст).
export function Wordmark({ size = 22 }) {
  return <span className="brand-text" style={{ fontSize: size }}>Hailu</span>
}
