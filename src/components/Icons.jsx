import React from 'react'

// Набор аккуратных линейных иконок (в стиле Lucide), единый вид во всём UI.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

const wrap = (children, { size = 22, ...rest } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>{children}</svg>
)

export const IconHome = (p) => wrap(
  <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>, p)

export const IconSearch = (p) => wrap(
  <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, p)

export const IconHeart = (p) => wrap(
  <path d="M12 20s-7-4.4-9.4-8.6C1 8.3 2.3 5 5.4 5c1.9 0 3.1 1.1 3.9 2.3l.1.2.1-.2C10.3 6.1 11.5 5 13.4 5c3.1 0 4.4 3.3 2.8 6.4C19 15.6 12 20 12 20Z" />, p)

export const IconHeartFilled = ({ size = 22, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...rest}>
    <path d="M12 20s-7-4.4-9.4-8.6C1 8.3 2.3 5 5.4 5c1.9 0 3.1 1.1 3.9 2.3l.1.2.1-.2C10.3 6.1 11.5 5 13.4 5c3.1 0 4.4 3.3 2.8 6.4C19 15.6 12 20 12 20Z" />
  </svg>
)

export const IconPlay = ({ size = 22, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...rest}>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
  </svg>
)

export const IconPause = ({ size = 22, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...rest}>
    <rect x="6" y="5" width="4" height="14" rx="1.3" /><rect x="14" y="5" width="4" height="14" rx="1.3" />
  </svg>
)

export const IconNext = ({ size = 22, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...rest}>
    <path d="M5 5.5v13a1 1 0 0 0 1.5.87L15 14.3V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v3.7L6.5 4.63A1 1 0 0 0 5 5.5Z" />
  </svg>
)

export const IconPrev = ({ size = 22, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...rest}>
    <path d="M19 5.5v13a1 1 0 0 1-1.5.87L9 14.3V18a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v3.7l8.5-5.07A1 1 0 0 1 19 5.5Z" />
  </svg>
)

export const IconShuffle = (p) => wrap(
  <><path d="M16 4h4v4" /><path d="m4 20 16-16" /><path d="M16 20h4v-4" /><path d="m4 4 5 5" /><path d="m15 15 5 5" /></>, p)

export const IconRepeat = (p) => wrap(
  <><path d="m17 3 3 3-3 3" /><path d="M20 6H8a4 4 0 0 0-4 4v1" /><path d="m7 21-3-3 3-3" /><path d="M4 18h12a4 4 0 0 0 4-4v-1" /></>, p)

export const IconVolume = (p) => wrap(
  <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a9 9 0 0 1 0 12" /></>, p)

export const IconPalette = (p) => wrap(
  <><path d="M12 3a9 9 0 1 0 0 18c.8 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Z" /><circle cx="7.5" cy="11.5" r="1" /><circle cx="11" cy="7.5" r="1" /><circle cx="16" cy="9.5" r="1" /></>, p)

export const IconLogout = (p) => wrap(
  <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>, p)

export const IconCheck = (p) => wrap(<path d="m20 6-11 11-5-5" />, p)

export const IconClose = (p) => wrap(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>, p)
