'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
    const marker = document.getElementById('article-end')
    if (!marker) return

    const rect = marker.getBoundingClientRect()
    const windowHeight = window.innerHeight

    const total = rect.top + window.scrollY
    const current = window.scrollY + windowHeight

    const pct = total > 0 ? (current / total) * 100 : 0

    setProgress(Math.min(pct, 100))
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
