'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'

interface Props {
  name: string
  isSubscriber: boolean
  rankName: string
  rankSymbol: string
}



const sidebarLinks = [
  { href: '#xp',        label: 'XP & Rank',   icon: '✦' },
  { href: '#atividade', label: 'Atividade',    icon: '◈' },
  { href: '#historico', label: 'Histórico',    icon: '◎' },
  { href: '#livros',    label: 'Livros',        icon: '☿' },
  { href: '#config',    label: 'Configurações', icon: '○' },
]

export default function ProfileSidebar({ name, isSubscriber, rankName, rankSymbol }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
    {/* Mobile identity strip — visible on mobile only (sidebar is horizontal tabs on mobile) */}
    <div className="profile-mobile-identity" style={{ padding: '16px var(--px-sm) 16px', borderBottom: '1px solid var(--faint)' }}>
      <Avatar name={name} size="sm" />
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2, color: 'var(--cream)' }}>{name}</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', textTransform: 'uppercase', marginTop: 2 }}>
          {rankSymbol} {rankName} · {isSubscriber ? 'Iniciado' : 'Profano'}
        </p>
      </div>
    </div>

    <aside
      className="profile-sidebar"
      style={{
        width: collapsed ? 56 : 280,
        minWidth: collapsed ? 56 : 280,
        transition: 'width 0.22s ease, min-width 0.22s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Toggle button ── */}
      <div style={{
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-end',
        padding: collapsed ? '0 0 20px' : '0 20px 20px',
      }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          style={{
            background: 'none',
            border: '1px solid var(--faint)',
            color: 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            cursor: 'pointer',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 3,
            transition: 'color .15s, border-color .15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)'
          }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* ── Identity (desktop only, hidden when collapsed) ── */}
      <div
        className="profile-identity-mobile-hide"
        style={{
          padding: '0 32px 32px',
          borderBottom: '1px solid var(--faint)',
          marginBottom: 8,
          opacity: collapsed ? 0 : 1,
          transition: 'opacity 0.15s ease',
          pointerEvents: collapsed ? 'none' : 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <Avatar name={name} size="lg" />
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 3, color: 'var(--cream)' }}>
          {name}
        </p>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
          color: isSubscriber ? 'var(--red)' : 'var(--muted)',
          textTransform: 'uppercase', marginTop: 4,
        }}>
          {rankSymbol} {rankName} · {isSubscriber ? 'Iniciado' : 'Profano'}
        </span>
      </div>

      {/* ── Nav ── */}
      <ul className="profile-sidebar-nav" style={{ listStyle: 'none', padding: '8px 0', flex: 1 }}>
        {sidebarLinks.map(({ href, label, icon }) => (
          <li key={href}>
            <a
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px 0' : '12px 32px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                color: 'var(--muted)', textDecoration: 'none',
                transition: 'all .2s',
                borderLeft: collapsed ? '2px solid transparent' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--gold)', opacity: 0.65, width: 16, textAlign: 'center', flexShrink: 0 }}>
                {icon}
              </span>
              {!collapsed && label}
            </a>
          </li>
        ))}
      </ul>

      {/* ── Upgrade CTA ── */}
      {!isSubscriber && (
        <div
          className="profile-identity-mobile-hide"
          style={{
            padding: collapsed ? '0 8px' : '0 32px',
            marginBottom: 16,
            marginTop: 'auto',
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.15s ease',
            pointerEvents: collapsed ? 'none' : 'auto',
          }}
        >
          <Link
            href="/membros"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center', fontSize: 12, padding: '12px', whiteSpace: 'nowrap' }}
          >
            Upgrade → Iniciado
          </Link>
        </div>
      )}

      {/* ── Logout ── */}
      <div
        className="profile-identity-mobile-hide"
        style={{ padding: collapsed ? '0 8px' : '0 32px' }}
      >
        {collapsed ? (
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sair"
              style={{
                background: 'none',
                border: '1px solid var(--faint)',
                color: 'var(--muted)',
                cursor: 'pointer',
                width: '100%',
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                borderRadius: 2,
              }}
            >
              ⏻
            </button>
          </form>
        ) : (
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="btn-historico-cta" style={{ width: '100%' }}>
              Sair →
            </button>
          </form>
        )}
      </div>
    </aside>
    </>
  )
}
