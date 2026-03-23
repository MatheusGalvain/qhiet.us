'use client'

import { useState } from 'react'

interface HermesBotProps {
  message?: string
}

export default function HermesBot({
  message = 'Explore o portal. O conhecimento aguarda.',
}: HermesBotProps) {
  const [hidden, setHidden] = useState(false)

  return (
    <div className="bot-wrap">
      <div className={`bot-card ${hidden ? 'hidden' : ''}`}>
        <div className="bot-from">HERMES ·</div>
        <div className="bot-text">{message}</div>
      </div>
      <button
        className="bot-btn"
        onClick={() => setHidden(h => !h)}
        aria-label={hidden ? 'Mostrar Hermes' : 'Ocultar Hermes'}
      >
        <HermesIcon />
      </button>
    </div>
  )
}

/* 10-pointed star SVG */
function HermesIcon() {
  // Generate 10-point star path
  const points = 10
  const outerR = 9
  const innerR = 4.2
  const cx = 10
  const cy = 10
  const pathParts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    pathParts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(3)},${y.toFixed(3)}`)
  }
  pathParts.push('Z')
  const starPath = pathParts.join(' ')

  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={starPath} stroke="#ede5d8" strokeWidth="1.2" fill="none" />
      <circle cx="10" cy="10" r="2.5" fill="#b02a1e" />
    </svg>
  )
}
