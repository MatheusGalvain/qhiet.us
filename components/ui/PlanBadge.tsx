'use client'

import { useState } from 'react'
import { PLAN_META } from '@/lib/plans'
import type { Plan } from '@/types'

interface PlanBadgeProps {
  plan: Plan
  /** 'pill' = small inline badge  |  'card' = full profile card  |  'inline' = tiny chip */
  variant?: 'pill' | 'card' | 'inline'
  animated?: boolean
}

export default function PlanBadge({ plan, variant = 'pill', animated = true }: PlanBadgeProps) {
  const meta = PLAN_META[plan ?? 'profano']
  const [hovered, setHovered] = useState(false)

  /* ── inline chip (used in nav dropdown, mobile header) ── */
  if (variant === 'inline') {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: meta.color,
        border: `1px solid ${meta.border}`,
        padding: '1px 6px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {meta.symbol} {meta.label}
      </span>
    )
  }

  /* ── pill (used in profile sidebar identity strip) ── */
  if (variant === 'pill') {
    return (
      <span
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={meta.tagline}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: meta.color,
          border: `1px solid ${meta.border}`,
          padding: '3px 10px',
          transition: 'box-shadow 0.3s ease',
          boxShadow: hovered && animated ? meta.glow : 'none',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 13, lineHeight: 1 }}>{meta.symbol}</span>
        {meta.label}
      </span>
    )
  }

  /* ── card (used in profile page as the main plan display) ── */
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${meta.border}`,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
        boxShadow: hovered && animated ? meta.glow : 'none',
        borderColor: hovered && animated ? meta.color : meta.border,
        background: 'rgba(0,0,0,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle corner ornament */}
      <span style={{
        position: 'absolute',
        top: 10,
        right: 14,
        fontFamily: 'var(--font-mono)',
        fontSize: 22,
        color: meta.color,
        opacity: hovered ? 0.25 : 0.1,
        transition: 'opacity 0.4s ease',
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {meta.symbol}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22,
          color: meta.color,
          lineHeight: 1,
          filter: hovered && plan !== 'profano' ? `drop-shadow(0 0 6px ${meta.color})` : 'none',
          transition: 'filter 0.3s ease',
        }}>
          {meta.symbol}
        </span>
        <div>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: meta.color,
            lineHeight: 1,
          }}>
            {meta.label}
          </p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            letterSpacing: 2,
            color: 'var(--cream)',
            opacity: 0.7,
            marginTop: 3,
          }}>
            {meta.tagline}
          </p>
        </div>
      </div>

      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: 1.5,
        color: 'var(--muted)',
        lineHeight: 1.7,
        maxWidth: 260,
      }}>
        {meta.description}
      </p>
    </div>
  )
}
