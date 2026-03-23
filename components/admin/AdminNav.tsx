'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin',              label: 'Dashboard',      icon: '◈' },
  { href: '/admin/transmissoes', label: 'Transmissões',   icon: '◎' },
  { href: '/admin/membros',      label: 'Membros',        icon: '○' },
  { href: '/admin/categorias',   label: 'Categorias',     icon: '△' },
]

interface Props {
  adminName: string
  adminEmail: string
}

export default function AdminNav({ adminName, adminEmail }: Props) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      borderRight: '1px solid var(--faint)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 0',
      position: 'sticky',
      top: 0,
    }}>
      {/* Wordmark */}
      <div style={{ padding: '0 28px', marginBottom: 40 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 4, color: 'var(--cream)' }}>
            QHIETH<span style={{ color: 'var(--red)' }}>US</span>
          </span>
        </Link>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--red)', textTransform: 'uppercase', marginTop: 6 }}>
          Painel Admin
        </p>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 2,
                textDecoration: 'none',
                background: isActive ? 'var(--red-faint)' : 'transparent',
                border: isActive ? '1px solid var(--red-dim)' : '1px solid transparent',
                transition: 'all .15s',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: isActive ? 'var(--red)' : 'var(--muted)', width: 18, textAlign: 'center' }}>
                {icon}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: isActive ? 'var(--cream)' : 'var(--muted)' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Admin identity */}
      <div style={{ padding: '20px 28px', borderTop: '1px solid var(--faint)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--cream)', marginBottom: 2 }}>
          {adminName}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)' }}>
          {adminEmail}
        </p>
        <Link
          href="/api/auth/logout"
          style={{ display: 'inline-block', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}
        >
          Sair →
        </Link>
      </div>
    </aside>
  )
}
