'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setProgress(pct)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const barColor = progress >= 100 ? 'var(--gold)' : 'var(--red)'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 2, zIndex: 200, background: 'var(--faint)',
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min(progress, 100)}%`,
        background: barColor,
        transition: 'width 0.1s linear, background 0.5s ease',
      }} />
    </div>
  )
}
