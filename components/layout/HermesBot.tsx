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

function HermesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#2a1e0c" strokeWidth=".8" />
      <circle cx="7.5" cy="8.5" r="1" fill="#b02a1e" opacity=".6" />
      <circle cx="12.5" cy="8.5" r="1" fill="#b02a1e" opacity=".6" />
      <path d="M7 13 Q10 15 13 13" stroke="#c8960a" strokeWidth=".8" fill="none" strokeLinecap="round" />
      <line x1="10" y1="1" x2="10" y2="3.5" stroke="#b02a1e" strokeWidth=".8" />
      <circle cx="10" cy=".8" r=".7" fill="#b02a1e" />
    </svg>
  )
}
