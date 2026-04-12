import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { PLAN_META, resolvePlans } from '@/lib/plans'
import type { Plan } from '@/types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Membros',
  description: 'Conheça os planos do QHIETHUS — Profano, Iniciado, Adepto e Acervo.',
}

async function getStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ count: transmissoesCount }, profileRes] = await Promise.all([
    supabase.from('transmissoes').select('*', { count: 'exact', head: true }),
    user ? supabase.from('profiles').select('plan, plans').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ])
  const rawPlan  = (profileRes.data as any)?.plan  as Plan | null
  const rawPlans = (profileRes.data as any)?.plans as string[] | null
  const activePlans = resolvePlans(rawPlans, rawPlan)
  return {
    transmissoesCount: transmissoesCount ?? 0,
    currentPlan:  (rawPlan ?? 'profano') as Plan,
    activePlans,   // e.g. ['acervo', 'iniciado'] or ['adepto']
    isLoggedIn: !!user,
  }
}

const PLANS: Array<{
  key: Plan
  price: string
  period: string
  tagline: string
  badge?: string
  featured?: boolean
  features: Array<{ on: boolean; text: string }>
}> = [
  {
    key: 'profano',
    price: 'R$ 0',
    period: 'gratuito',
    tagline: 'Para os que chegam',
    features: [
      { on: true,  text: 'Transmissões de Leitura Livre' },
      { on: true,  text: 'Bot Hermes para instruir' },
      { on: true,  text: 'Perfil com XP' },
      { on: true,  text: '1 livro mensal' },
      { on: false, text: 'Transmissões exclusivas' },
      { on: false, text: 'Quiz & XP bônus' },
      { on: false, text: 'Trilhas de estudo' },
      { on: false, text: 'Grimório Digital' },
      { on: false, text: 'Acervo de livros PDF' },
    ],
  },
  {
    key: 'iniciado',
    price: 'R$19,99',
    period: '/mês',
    tagline: 'Para os que escolhem permanecer',
    features: [
      { on: true, text: 'Tudo do plano Profano' },
      { on: true, text: '<strong>Transmissões exclusivas</strong>' },
      { on: true, text: 'Quiz de Hermes + <strong>XP bônus</strong>' },
      { on: true, text: '<strong>4 livros mensais</strong>' },
      { on: true, text: '<strong>Trilhas Exclusivas</strong> de estudo' },
      { on: true, text: 'Grimório Digital' },
      { on: true, text: 'Ranking global & Badges' },
      { on: false, text: 'Acervo de livros PDF' },
    ],
  },
  {
    key: 'adepto',
    price: 'R$27,90',
    period: '/mês',
    tagline: 'Acesso total — a via completa',
    badge: '✦ Recomendado',
    featured: true,
    features: [
      { on: true, text: 'Tudo do plano Iniciado' },
      { on: true, text: '<strong>Acervo completo</strong> de livros PDF' },
      { on: true, text: 'Progresso de leitura salvo' },
      { on: true, text: 'Hermetismo, Cabala, Alquimia, Tarot…' },
      { on: true, text: 'Suporte prioritário' },
    ],
  },
  {
    key: 'acervo',
    price: 'R$19,99',
    period: '/mês',
    tagline: 'Só a Biblioteca, foco em leitura',
    features: [
      { on: true, text: 'Transmissões de Leitura Livre' },
      { on: true, text: '<strong>Acervo completo</strong> de livros PDF' },
      { on: true, text: 'Progresso de leitura salvo' },
      { on: true, text: 'Grimório Digital' },
      { on: false, text: 'Transmissões exclusivas' },
      { on: false, text: 'Trilhas & XP bônus' },
    ],
  },
]

const COMPARE_ROWS = [
  { label: 'Transmissões Leitura Livre', profano: true,  iniciado: true,  adepto: true,  acervo: true  },
  { label: 'Transmissões Exclusivas',    profano: false, iniciado: true,  adepto: true,  acervo: false },
  { label: 'Quiz Hermes + XP bônus',    profano: false, iniciado: true,  adepto: true,  acervo: false },
  { label: 'Trilhas Exclusivas',         profano: false, iniciado: true,  adepto: true,  acervo: false },
  { label: 'Grimório Digital',           profano: false, iniciado: true,  adepto: true,  acervo: true  },
  { label: 'Livros Mensais',             profano: '1',   iniciado: '4',   adepto: '4',   acervo: '—'  },
  { label: 'Ranking Global',             profano: false, iniciado: true,  adepto: true,  acervo: false },
  { label: 'Badges de Conquista',        profano: false, iniciado: true,  adepto: true,  acervo: false },
  { label: 'Acervo de Livros PDF',       profano: false, iniciado: false, adepto: true,  acervo: true  },
  { label: 'Leitor PDF inline',          profano: false, iniciado: false, adepto: true,  acervo: true  },
]

export default async function MembrosPage({ searchParams }: { searchParams: { error?: string; detail?: string } }) {
  const { transmissoesCount, currentPlan, activePlans, isLoggedIn } = await getStats()
  const stripeError = searchParams?.error === 'stripe' ? (searchParams?.detail ?? 'Erro ao processar pagamento.') : null
  const configError = searchParams?.error === 'config'

  return (
    <>
      {/* Stripe error banner */}
      {(stripeError || configError) && (
        <div style={{ background: 'rgba(180,30,20,0.12)', border: '1px solid var(--red-dim)', borderLeft: '3px solid var(--red)', padding: '14px 20px', margin: '0 var(--px)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1.5, color: 'var(--red)', lineHeight: 1.8 }}>
          {configError
            ? 'Configuração incompleta — verifique as variáveis STRIPE_PRICE_ID_* no ambiente.'
            : stripeError}
        </div>
      )}

      {/* HERO */}
      <div className="membros-hero">
        <div style={{ padding: 'clamp(40px,6vw,72px) var(--px)', borderRight: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 20 }}>Portal Oculto · Planos de Acesso</p>
            <h1 className="hero-title-xl">
              A PORTA<br /><span style={{ color: 'var(--red)' }}>ESTÁ</span><br />ABERTA
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.5vw,19px)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 480, marginTop: 20 }}>
              Escolha como deseja percorrer o caminho. O conhecimento aguarda — a profundidade do acesso é sua escolha.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {activePlans.includes('adepto')
              ? <ActivePlanBadge plan="adepto" />
              : activePlans.length > 0
                ? <CheckoutButton plan="adepto" label="Upgrade → Adepto ✦" featured />
                : <CheckoutButton plan="iniciado" label="Assinar R$19,99/mês →" />
            }
            {!isLoggedIn && <Link href="/login?tab=register" className="btn-ghost">Criar conta grátis</Link>}
          </div>
        </div>

        <div className="hero-right" style={{ padding: 'clamp(20px,6vw,72px) var(--px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,2.5vw,28px)', letterSpacing: 2, color: 'var(--cream)', marginBottom: 14 }}>
            Dados do portal:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {[
              { n: String(transmissoesCount), l: 'Transmissões' },
              { n: '4',  l: 'Planos' },
              { n: '6',  l: 'Categorias' },
              { n: '∞',  l: 'Conhecimento' },
            ].map(({ n, l }, i) => (
              <div key={l} style={{ padding: 20, borderRight: i % 2 === 0 ? '1px solid var(--faint)' : 'none', borderBottom: i < 2 ? '1px solid var(--faint)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,52px)', color: 'var(--cream)', letterSpacing: 2, display: 'block', lineHeight: 1 }}>{n}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>{l}</span>
              </div>
            ))}
          </div>
          <blockquote style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 17, color: 'var(--muted)', lineHeight: 1.75, borderLeft: '1px solid var(--red-dim)', paddingLeft: 16 }}>
            "A iniciação não é um evento — é um processo contínuo de transformação interior."
            <cite style={{ display: 'block', marginTop: 8, fontStyle: 'normal', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--cream)' }}>— Tradição Hermética</cite>
          </blockquote>
        </div>
      </div>

      {/* PLANOS GRID */}
      <div style={{ borderBottom: '1px solid var(--faint)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '20px var(--px)', borderBottom: '1px solid var(--faint)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,64px)', letterSpacing: 3, color: 'var(--red)' }}>PLANOS</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)' }}>Sem fidelidade. Cancele quando quiser.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          {PLANS.map((p) => {
            const meta = PLAN_META[p.key]

            // ── Multi-plan button logic ─────────────────────────────────
            // isActive: this specific plan is in the user's active plans array
            const isActive = activePlans.includes(p.key)
            // includedInAdepto: user has adepto (superset), this card is not adepto
            const includedInAdepto = activePlans.includes('adepto') && p.key !== 'adepto'
            // canUpgradeToAdepto: user holds both iniciado+acervo → upgrade to adepto shown
            const canUpgradeToAdepto = p.key === 'adepto'
              && activePlans.includes('iniciado')
              && activePlans.includes('acervo')
              && !activePlans.includes('adepto')

            return (
              <div key={p.key} style={{
                padding: 'clamp(20px,3vw,36px)',
                borderRight: '1px solid var(--faint)',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
                background: p.featured ? 'linear-gradient(135deg,var(--surface),rgba(130,111,18,.07))' : 'transparent',
                boxShadow: p.featured ? `inset 0 0 0 1px var(--gold)` : 'none',
              }}>
                {p.badge && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: 'var(--gold)', color: '#000',
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
                    padding: '3px 10px', textTransform: 'uppercase',
                  }}>
                    {p.badge}
                  </div>
                )}

                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 4,
                  textTransform: 'uppercase', color: meta.color,
                  border: `1px solid ${meta.border}`, padding: '2px 8px',
                  display: 'inline-block', marginBottom: 18, alignSelf: 'flex-start',
                }}>
                  {meta.symbol} {meta.label}
                </span>

                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,52px)', color: 'var(--cream)', letterSpacing: 2, lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginLeft: 4 }}>{p.period}</span>
                </div>

                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
                  {p.tagline}
                </p>

                <div style={{ height: 1, background: p.featured ? 'var(--gold)' : 'var(--faint)', marginBottom: 20 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 24 }}>
                  {p.features.map(({ on, text }, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: on ? meta.color : 'var(--cream-dim)', flexShrink: 0, marginTop: 2 }}>
                        {on ? '◉' : '○'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: on ? 'var(--cream)' : 'var(--cream-dim)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: text }} />
                    </div>
                  ))}
                </div>

                {isActive
                  ? <ActivePlanBadge plan={p.key} fullWidth />
                  : p.key === 'profano'
                    ? <Link href={isLoggedIn ? '/perfil' : '/login?tab=register'} style={{ display: 'block', textAlign: 'center', padding: '13px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', textDecoration: 'none' }}>
                        {isLoggedIn ? 'Meu perfil →' : 'Criar conta grátis'}
                      </Link>
                  : includedInAdepto
                    ? <CheckoutButton plan={p.key} label="Incluído no Adepto" fullWidth disabled />
                  : canUpgradeToAdepto
                    ? <CheckoutButton plan="adepto" label="Upgrade → Adepto ✦" fullWidth featured />
                    : <CheckoutButton
                        plan={p.key}
                        label={activePlans.length > 0 && p.key === 'adepto' ? 'Upgrade → Adepto ✦' : 'Assinar →'}
                        fullWidth
                        featured={p.featured}
                      />
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* COMPARE TABLE */}
      <div style={{ borderBottom: '1px solid var(--faint)' }}>
        <div className="section-div"><div className="sdiv-line" /><span className="sdiv-sym">◈</span><span className="sdiv-text">Comparação Detalhada</span><div className="sdiv-line" /></div>
        <div className="compare-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={thSt}>Recurso</th>
                {(['profano', 'iniciado', 'adepto', 'acervo'] as Plan[]).map(pk => (
                  <th key={pk} style={{ ...thSt, color: PLAN_META[pk].color, width: 120, textWrap: "nowrap" }}>
                    {PLAN_META[pk].symbol} {PLAN_META[pk].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(({ label, ...vals }, i) => (
                <tr key={i}>
                  <td style={tdSt}>{label}</td>
                  {(['profano', 'iniciado', 'adepto', 'acervo'] as Plan[]).map(pk => {
                    const v = (vals as any)[pk]
                    return (
                      <td key={pk} style={{ ...tdSt, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {typeof v === 'boolean'
                          ? <span style={{ color: v ? PLAN_META[pk].color : 'var(--cream-dim)' }}>{v ? '◉' : '○'}</span>
                          : <span style={{ color: 'var(--cream)' }}>{v}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <HermesBot message="Dúvidas sobre os planos? O Adepto oferece acesso total — transmissões exclusivas, trilhas e a biblioteca completa de PDFs." />
    </>
  )
}

const thSt: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
  color: 'var(--muted)', padding: '14px var(--px)', borderBottom: '1px solid var(--faint)', textAlign: 'left',
}
const tdSt: React.CSSProperties = {
  padding: '12px var(--px)', borderBottom: '1px solid var(--faint)',
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)',
}

function CheckoutButton({ plan, label, fullWidth = false, featured = false, disabled = false }: {
  plan: string; label: string; fullWidth?: boolean; featured?: boolean; disabled?: boolean
}) {
  if (disabled) {
    return (
      <div style={{
        width: fullWidth ? '100%' : 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: fullWidth ? '13px' : '10px 16px',
        border: '1px solid var(--cream-dim)',
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
        textTransform: 'uppercase', color: 'var(--cream-dim)',
        cursor: 'default', userSelect: 'none',
      }}>
        ◉ {label}
      </div>
    )
  }
  return (
    <form action="/api/checkout" method="POST" style={{ width: fullWidth ? '100%' : 'auto', display: 'inline-block' }}>
      <input type="hidden" name="plan" value={plan} />
      <button type="submit" className="btn-primary" style={{
        display: 'block', width: fullWidth ? '100%' : 'auto', textAlign: 'center',
        background: featured ? 'var(--gold)' : undefined,
        color: featured ? '#000' : undefined,
      }}>
        {label}
      </button>
    </form>
  )
}

function ActivePlanBadge({ plan, fullWidth = false }: { plan: Plan; fullWidth?: boolean }) {
  const meta = PLAN_META[plan]
  return (
    <div style={{
      width: fullWidth ? '100%' : 'auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: fullWidth ? 'center' : 'flex-start',
      gap: 8, padding: fullWidth ? '13px' : '10px 14px',
      border: `1px solid ${meta.border}`,
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
      textTransform: 'uppercase' as const, color: meta.color,
    }}>
      <span>{meta.symbol}</span> Plano {meta.label} ativo
    </div>
  )
}
