'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Wordmark from '@/components/ui/Wordmark'
import Avatar from '@/components/ui/Avatar'
import type { Profile } from '@/types'

interface NavProps {
  profile?: Profile | null
}

const NAV_LINKS = [
  { href: '/transmissoes', label: 'Transmissões' },
  { href: '/categorias',   label: 'Categorias' },
  { href: '/ranking',      label: 'Ranking' },
  { href: '/membros',      label: 'Membros' },
]

export default function Nav({ profile }: NavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])
  // Lock scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <nav className="nav">
        {/* LEFT cluster — wordmark + links together */}
        <div className="nav-left-cluster">
          <Wordmark />

          {/* Desktop links */}
          <div className="nav-links-wrapper">
            <ul className="nav-links">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT — desktop auth + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          {/* Desktop auth controls */}
          <div className="nav-desktop-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nav-dot" />
            {profile ? (
              <Link href="/perfil">
                <Avatar name={profile.name} size="sm" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="nav-btn">Entrar</Link>
                <Link href="/membros" className="nav-btn primary">Assinar</Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className={`hamburger-btn ${open ? 'open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </nav>

      {/* MOBILE OVERLAY */}
      <div
        className={`mobile-menu-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* MOBILE DRAWER */}
      <div className={`mobile-drawer ${open ? 'open' : ''}`} role="dialog" aria-label="Navegação">
        {/* Drawer header */}
        <div style={{
          padding: '0 32px 24px',
          borderBottom: '1px solid var(--faint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Wordmark />
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        {/* User badge (if logged in) */}
        {profile && (
          <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--faint)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={profile.name} size="sm" />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2, color: 'var(--cream)' }}>{profile.name}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', textTransform: 'uppercase', marginTop: 2 }}>
                {profile.is_subscriber ? '◈ Iniciado' : '◉ Profano'}
              </p>
            </div>
          </div>
        )}

        {/* Links */}
        <nav className="mobile-drawer-links">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-drawer-link ${pathname.startsWith(href) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
          {profile && (
            <Link href="/perfil" className={`mobile-drawer-link ${pathname === '/perfil' ? 'active' : ''}`}>
              Meu Perfil
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="mobile-drawer-actions">
          {!profile ? (
            <>
              <Link href="/login" className="btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
                Entrar
              </Link>
              <Link href="/membros" className="btn-primary" style={{ textAlign: 'center', display: 'block' }}>
                Assinar →
              </Link>
            </>
          ) : (
            <form action="/api/auth/logout" method="POST">
              <button type="submit" style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', padding: 12, cursor: 'pointer' }}>
                Sair
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 32px', borderTop: '1px solid var(--faint)', marginTop: 'auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase' }}>
            QHIETHUS · Portal Oculto · Est. MMXXVI
          </p>
        </div>
      </div>
    </>
  )
}
