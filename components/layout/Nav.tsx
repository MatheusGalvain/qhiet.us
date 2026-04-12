'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Wordmark from '@/components/ui/Wordmark'
import Avatar from '@/components/ui/Avatar'
import type { Profile } from '@/types'
import { PLAN_META } from '@/lib/plans'

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
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

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
              <div ref={avatarRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setAvatarOpen(o => !o)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  aria-label="Menu do perfil"
                >
                  <Avatar name={profile.name} size="sm" />
                </button>

                {avatarOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    minWidth: 180,
                    background: 'black',
                    border: '1px solid var(--faint)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}>
                    {/* User info */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--faint)' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 2, color: 'var(--cream)', marginBottom: 2 }}>
                        {profile.name}
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--red)', textTransform: 'uppercase' }}>
                        {(() => { const m = PLAN_META[profile.plan ?? 'profano']; return `${m.symbol} ${m.label}` })()}
                      </p>
                    </div>

                    {/* Links */}
                    <Link
                      href="/perfil"
                      onClick={() => setAvatarOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 18px',
                        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                        color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none',
                        borderBottom: '1px solid var(--faint)',
                        transition: 'color .15s, background .15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                    >
                      Perfil <span style={{ opacity: 0.5 }}>→</span>
                    </Link>

                    <form action="/api/auth/logout" method="POST">
                      <button
                        type="submit"
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 18px',
                          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                          color: 'var(--muted)', textTransform: 'uppercase',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          transition: 'color .15s, background .15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(180,30,20,0.06)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                      >
                        Sair <span style={{ opacity: 0.5 }}>→</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="nav-btn text-[8px] lg:text-xs">Entrar</Link>
                <Link href="/membros" className="nav-btn text-[8px] lg:text-xs primary">Assinar</Link>
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
                {(() => { const m = PLAN_META[profile.plan ?? 'profano']; return `${m.symbol} ${m.label}` })()}
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
            <>
              <Link href="/perfil" className={`mobile-drawer-link ${pathname === '/perfil' ? 'active' : ''}`}>
                Meu Perfil
              </Link>
              {/* Sub-links do perfil */}
              <div style={{ borderLeft: '1px solid var(--cream-dim)', marginLeft: 32, paddingLeft: 0, display: 'flex', flexDirection: 'column' }}>
                <Link href="/perfil/grimorio" className={`mobile-drawer-link mobile-drawer-sublink ${pathname.startsWith('/perfil/grimorio') ? 'active' : ''}`}>
                  ◈ Grimório
                </Link>
                <Link href="/perfil/trilhas" className={`mobile-drawer-link mobile-drawer-sublink ${pathname.startsWith('/perfil/trilhas') ? 'active' : ''}`}>
                  ◎ Trilhas
                </Link>
                <Link href="/perfil/biblioteca" className={`mobile-drawer-link mobile-drawer-sublink ${pathname.startsWith('/perfil/biblioteca') ? 'active' : ''}`}>
                  ✦ Acervo
                </Link>
              </div>
            </>
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
