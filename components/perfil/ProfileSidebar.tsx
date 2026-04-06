'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanBadge from '@/components/ui/PlanBadge'
import AcervoGateway from '@/components/perfil/AcervoGateway'
import EditNameModal from '@/components/perfil/EditNameModal'
import { canAccess, canAccessAny, resolvePlans } from '@/lib/plans'
import type { Plan } from '@/types'

interface Props {
  name: string
  email: string
  plan: Plan
  plans?: string[]    // full active plans array
  isSubscriber: boolean
  rankName: string
  rankSymbol: string
  bookCount?: number
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export default function ProfileSidebar({ name: initialName, email, plan, plans, isSubscriber, rankName, rankSymbol, bookCount = 0 }: Props) {
  // Resolve multi-plan array for access checks
  const activePlans = resolvePlans(plans ?? null, plan)
  const can = (feature: Parameters<typeof canAccess>[1]) => canAccessAny(activePlans, feature)
  const pathname = usePathname()
  const [name, setName]         = useState(initialName)
  const [editOpen, setEditOpen] = useState(false)
  const [justSaved, setSaved]   = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [resetState, setResetState] = useState<'idle' | 'confirm' | 'sending' | 'sent'>('idle')
  const [resetError, setResetError] = useState<string | null>(null)

  // Always anchor to /perfil — works from any sub-page
  const profileHref = (hash: string) => `/perfil${hash}`

  function handleSaved(n: string) {
    setName(n)
    setEditOpen(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleResetConfirm() {
    setResetState('sending')
    setResetError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?redirect=/redefinir-senha`,
    })
    if (error) { setResetError(error.message); setResetState('confirm'); return }
    setResetState('sent')
  }

  const navLinks = [
    { hash: '#xp',        label: 'XP & Rank',  icon: '✦' },
    { hash: '#atividade', label: 'Atividade',   icon: '◈' },
    { hash: '#historico', label: 'Histórico',   icon: '◎' },
    { hash: '#livros',    label: 'Livros',       icon: '☿' },
    { hash: '#config',    label: 'Config',       icon: '○' },
  ]

  return (
    <>
      {/* ══════════════════════════════════
          MOBILE top bar
      ══════════════════════════════════ */}
      <div className="profile-mobile-identity">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px var(--px-sm)',
          borderBottom: '1px solid var(--faint)',
          background: '#1b1b1a',
        }}>
          {/* Avatar */}
          <button
            onClick={() => setEditOpen(true)}
            title="Editar nome"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
          >
            <div className="avatar" style={{ width: 34, height: 34, fontSize: 15 }}>{getInitial(name)}</div>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              onClick={() => setEditOpen(true)}
              style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 2, color: 'var(--cream)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
                {rankSymbol} {rankName}
              </span>
              <PlanBadge plan={plan} variant="inline" />
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button type="submit" title="Sair" style={{ background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>⏻</button>
          </form>
        </div>

        <nav className="profile-mobile-nav">
          <a href={profileHref('#xp')}><span className="pmn-icon">✦</span>XP</a>
          <a href={profileHref('#atividade')}><span className="pmn-icon">◈</span>Atividade</a>
          <a href={profileHref('#historico')}><span className="pmn-icon">◎</span>Histórico</a>
          <a href={profileHref('#livros')}><span className="pmn-icon">☿</span>Livros</a>
          {(can('trilhas') || can('acervo')) && (
            <Link href="/perfil/trilhas"><span className="pmn-icon">◉</span>Trilhas</Link>
          )}
          {can('grimorio') && (
            <Link href="/perfil/grimorio" className="pmn-subscriber"><span className="pmn-icon">✧</span>Grimório</Link>
          )}
          {can('acervo') && (
            <Link href="/perfil/biblioteca" style={{ color: '#b8a07a' }}>
              <span className="pmn-icon" style={{ color: '#b8a07a' }}>◉</span>Acervo
            </Link>
          )}
          <a href={profileHref('#config')}><span className="pmn-icon">○</span>Config</a>
        </nav>
      </div>

      {/* ══════════════════════════════════
          DESKTOP SIDEBAR
      ══════════════════════════════════ */}
      <aside
        className="profile-sidebar"
        style={{ width: collapsed ? 52 : 264, minWidth: collapsed ? 52 : 264, transition: 'width .22s ease, min-width .22s ease' }}
      >
        {/* ── Collapsed toggle (only when collapsed) ── */}
        {collapsed && (
          <div className="profile-identity-mobile-hide" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 14px' }}>
            <button
              onClick={() => setCollapsed(false)}
              title="Expandir"
              style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)' }}
            >›</button>
          </div>
        )}

        {/* ── Identity block (with toggle embedded when expanded) ── */}
        {!collapsed && (
          <div
            className="profile-identity-mobile-hide"
            style={{
              position: 'relative',
              padding: '14px 20px 16px',
              borderBottom: '1px solid var(--faint)',
              marginBottom: 6,
            }}
          >
            {/* Collapse toggle — top-right corner */}
            <button
              onClick={() => setCollapsed(true)}
              title="Recolher"
              style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, transition: 'color .15s, border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)' }}
            >‹</button>

            {/* Avatar + Name */}
            <div
              onClick={() => setEditOpen(true)}
              title="Editar nome"
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, paddingRight: 28 }}
            >
              <div className="avatar" style={{ width: 40, height: 40, fontSize: 17, flexShrink: 0 }}>
                {getInitial(name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 2, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}>
                  {name}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: justSaved ? 'var(--gold)' : 'var(--cream-dim)', textTransform: 'uppercase', marginTop: 3, transition: 'color .3s' }}>
                  {justSaved ? '✦ Atualizado' : '✎ editar nome'}
                </p>
              </div>
            </div>

            {/* Rank + email */}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, color: 'var(--muted)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {rankSymbol} {rankName} · <span style={{ opacity: 0.6, textTransform: 'lowercase' }}>{email}</span>
            </p>

            {/* Plan badge — wrapped to prevent flex stretch */}
            <div style={{ display: 'flex' }}>
              <PlanBadge plan={plan} variant="pill" />
            </div>
          </div>
        )}


        {/* ── Nav ── */}
        <nav className="profile-sidebar-nav profile-identity-mobile-hide" style={{ flex: '0 0 auto' }}>
          {navLinks.map(({ hash, label, icon }) => (
            <a
              key={hash}
              href={profileHref(hash)}
              className={`sidebar-nav-link${collapsed ? ' collapsed' : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className="snl-icon" style={{ color: hash === '#config' ? 'var(--muted)' : 'var(--gold)', opacity: hash === '#config' ? 0.4 : 0.6 }}>{icon}</span>
              {!collapsed && label}
            </a>
          ))}

          {(can('trilhas') || can('grimorio') || can('acervo')) && !collapsed && (
            <div style={{ margin: '6px 20px', height: 1, background: 'var(--faint)' }} />
          )}

          {(can('trilhas') || can('acervo')) && (
            <Link
              href="/perfil/trilhas"
              className={`sidebar-nav-link subscriber${collapsed ? ' collapsed' : ''}${pathname === '/perfil/trilhas' ? ' active' : ''}`}
              title={collapsed ? 'Trilhas' : undefined}
            >
              <span className="snl-icon">◉</span>
              {!collapsed && 'Trilhas'}
            </Link>
          )}
          {can('grimorio') && (
            <Link
              href="/perfil/grimorio"
              className={`sidebar-nav-link subscriber${collapsed ? ' collapsed' : ''}${pathname === '/perfil/grimorio' ? ' active' : ''}`}
              title={collapsed ? 'Grimório' : undefined}
            >
              <span className="snl-icon">✧</span>
              {!collapsed && 'Grimório'}
            </Link>
          )}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 12 }} />

        {/* ── Acervo Gateway ── */}
        <div className="profile-identity-mobile-hide">
          <AcervoGateway plan={plan} plans={plans} bookCount={bookCount} collapsed={collapsed} />
        </div>

        {/* ── Upgrade CTAs ── */}
        {!collapsed && plan === 'profano' && (
          <div className="profile-identity-mobile-hide" style={{ padding: '8px 18px 4px' }}>
            <Link href="/membros" className="btn-primary" style={{ display: 'block', textAlign: 'center', fontSize: 10, padding: '10px', whiteSpace: 'nowrap' }}>
              Upgrade → Iniciado
            </Link>
          </div>
        )}
        {!collapsed && plan === 'iniciado' && (
          <div className="profile-identity-mobile-hide" style={{ padding: '8px 18px 4px' }}>
            <Link href="/membros?upgrade=adepto" style={{ display: 'block', textAlign: 'center', fontSize: 10, padding: '10px', fontFamily: 'var(--font-mono)', letterSpacing: 2, color: 'var(--gold)', border: '1px solid var(--gold-dim)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              ✦ Upgrade → Adepto
            </Link>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="profile-identity-mobile-hide" style={{ padding: collapsed ? '10px 8px 0' : '10px 18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!collapsed && (
            <>
              {resetState === 'idle' && (
                <button
                  onClick={() => setResetState('confirm')}
                  style={{ background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', padding: '9px 14px', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'color .15s, border-color .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)' }}
                >
                  Redefinir senha →
                </button>
              )}
              {resetState === 'confirm' && (
                <div style={{ border: '1px solid var(--faint)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', lineHeight: 1.6 }}>
                    Enviar link para<br /><span style={{ color: 'var(--cream)', fontSize: 8 }}>{email}</span>?
                  </p>
                  {resetError && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)' }}>{resetError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleResetConfirm} style={{ flex: 1, background: 'transparent', border: '1px solid var(--red-dim)', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '8px 0', cursor: 'pointer' }}>Sim</button>
                    <button onClick={() => { setResetState('idle'); setResetError(null) }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '8px 0', cursor: 'pointer' }}>Não</button>
                  </div>
                </div>
              )}
              {resetState === 'sending' && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', padding: '9px 0' }}>Enviando...</p>
              )}
              {resetState === 'sent' && (
                <div style={{ border: '1px solid var(--faint)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>
                  ✦ Link enviado
                </div>
              )}
            </>
          )}

          <form action="/api/auth/logout" method="POST">
            {collapsed ? (
              <button type="submit" title="Sair" style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', cursor: 'pointer', width: '100%', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, borderRadius: 2 }}>⏻</button>
            ) : (
              <button type="submit" className="btn-historico-cta" style={{ width: '100%' }}>Sair →</button>
            )}
          </form>
        </div>
      </aside>

      {/* ── Edit name modal (shared mobile + desktop) ── */}
      {editOpen && (
        <EditNameModal name={name} onClose={() => setEditOpen(false)} onSaved={handleSaved} />
      )}
    </>
  )
}