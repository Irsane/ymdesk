import React from 'react'

// Логотип Hailu — стилизованный эквалайзер в скруглённом квадрате
// с фирменным градиентом. animated=true оживляет столбики.
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
      <g fill="#0a0010">
        <rect className="bar b1" x="11" y="19" width="4.6" height="10" rx="2.3" />
        <rect className="bar b2" x="18.4" y="13" width="4.6" height="22" rx="2.3" />
        <rect className="bar b3" x="25.8" y="9" width="4.6" height="30" rx="2.3" />
        <rect className="bar b4" x="33.2" y="16" width="4.6" height="16" rx="2.3" />
      </g>
    </svg>
  )
}

// Текстовый логотип-словомарка.
export function Wordmark({ size = 22 }) {
  return <span className="wordmark" style={{ fontSize: size }}>Hailu</span>
}
