'use client'

import { useState, useEffect } from 'react'

export default function ArticleReadingTheme() {
  const [light, setLight] = useState(false)

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem('reading-theme')
    if (saved === 'light') setLight(true)
  }, [])

  function toggle() {
    const next = !light
    setLight(next)
    localStorage.setItem('reading-theme', next ? 'light' : 'dark')
    // Toggle class on article element
    document.getElementById('article-content')?.classList.toggle('reading-light', next)
  }

  // Apply on mount if saved
  useEffect(() => {
    const saved = localStorage.getItem('reading-theme')
    if (saved === 'light') {
      document.getElementById('article-content')?.classList.add('reading-light')
    }
  }, [])

  return (
    <button
      onClick={toggle}
      title={light ? 'Modo escuro' : 'Modo claro'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: `1px solid ${light ? 'var(--gold)' : 'var(--faint)'}`,
        color: light ? 'var(--gold)' : 'var(--muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 3,
        textTransform: 'uppercase',
        padding: '6px 14px',
        cursor: 'pointer',
        transition: 'all .2s',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 13 }}>{light ? '◉' : '○'}</span>
      {light ? 'Escuro' : 'Claro'}
    </button>
  )
}
