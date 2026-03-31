import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Membros',
  description: 'Conheça os planos do QHIETHUS — Profano (gratuito) e Iniciado (R$19,99/mês).',
}

async function getStats() {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: transmissoesCount }, { count: livrosCount }, { data: ranking }, { data: profile }] = await Promise.all([
    supabase.from('transmissoes').select('*', { count: 'exact', head: true }),
    supabase.from('monthly_books').select('*', { count: 'exact', head: true }),
    service
      .from('profiles')
      .select('id, name, nick, xp_total, is_subscriber')
      .order('xp_total', { ascending: false })
      .limit(10),
    user
      ? supabase.from('profiles').select('is_subscriber').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])
  return {
    transmissoesCount: transmissoesCount ?? 0,
    livrosCount: livrosCount ?? 0,
    ranking: (ranking ?? []) as Array<{ id: string; name: string; nick: string | null; xp_total: number; is_subscriber: boolean }>,
    isSubscriber: (profile as any)?.is_subscriber ?? false,
  }
}

const PLAN_FEATURES = {
  profano: [
    { check: true,  text: 'Acesso a todas as transmissões de <strong>Leitura Livre</strong>' },
    { check: true,  text: '<strong>1 livro mensal</strong> por e-mail' },
    { check: true,  text: 'Perfil com XP e ranking global' },
    { check: false, text: 'Transmissões exclusivas Iniciado' },
    { check: false, text: 'Quiz de IA Hermes com XP bônus' },
    { check: false, text: '1 livros mensal' },
  ],
  iniciado: [
    { check: true, text: 'Tudo do plano Profano' },
    { check: true, text: '<strong>Todas as transmissões</strong> — inclusive exclusivas' },
    { check: true, text: 'Quiz de <strong>IA Hermes</strong> ao final de cada artigo' },
    { check: true, text: '<strong>4 livros mensais</strong> curados por e-mail/ebook' },
    { check: true, text: 'XP bônus por quiz e leitura exclusiva' },
    // { check: true, text: 'Recomendação' },
  ],
}

const COMPARE_ROWS = [
  { label: 'Transmissões Exclusivas Iniciado',      profano: false,    iniciado: true },
  { label: 'Badge de assinante no perfil',          profano: false,    iniciado: true },
  { label: 'Quiz liberado em artigos com bônus de xp',                     profano: false,    iniciado: true },
  { label: 'Transmissões de Leitura Livre',        profano: true,     iniciado: true },
  { label: 'Quiz de IA Hermes',                     profano: true,    iniciado: true },
  { label: 'XP por leitura',                        profano: true,     iniciado: true },
  { label: 'Livros mensais por e-mail',             profano: '1 livro', iniciado: '4 livros' },
  { label: 'Ranking global',                        profano: true,     iniciado: true },
]

export default async function MembrosPage() {
  const { transmissoesCount, livrosCount, ranking, isSubscriber } = await getStats()
  return (
    <>
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
            {isSubscriber
              ? <ActivePlanBadge />
              : <CheckoutButton label="Assinar R$19,99/mês →" />
            }
            <Link href="/login?tab=register" className="btn-ghost">Criar conta grátis</Link>
          </div>
        </div>

        {/* Hero right (hidden on mobile via .page-hero / .hero-right) */}
        <div className="hero-right" style={{ padding: 'clamp(20px,6vw,7290px) var(--px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,2.5vw,28px)', letterSpacing: 2, color: 'var(--cream)', marginBottom: 14 }}>
            Dados reais do nosso portal:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {[
              { n: String(transmissoesCount), l: 'Transmissões' },
              { n: String(livrosCount || '∞'), l: 'Livros Ativos' },
              { n: '6',   l: 'Categorias' },
              { n: '∞',   l: 'Conhecimento' },
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

      {/* O QUE É */}
      <div className="section-div"><div className="sdiv-line" /><span className="sdiv-sym">◉</span><span className="sdiv-text">O que disponibilizamos</span><div className="sdiv-line" /></div>

      <div className="what-grid">
        {[
          { n: '01', title: 'Transmissões', desc: 'Artigos aprofundados sobre hermetismo, cabala, gnosticismo, alquimia, tarot e rosacruz — organizados em categorias temáticas.' },
          { n: '02', title: 'Quiz Hermes',  desc: 'Ao final de cada transmissão, a IA Hermes gera questões de compreensão. Acerte para ganhar XP bônus e subir no ranking.' },
          { n: '03', title: 'Livros Mensais', desc: 'Todo mês, livros de referência chegam direto no seu e-mail. Profanos recebem 1 — Iniciados recebem 4 títulos curados.' },
        ].map(({ n, title, desc }) => (
          <div key={n} className="what-col" style={{ padding: 'clamp(28px,4vw,48px) clamp(20px,3vw,40px)', borderRight: '1px solid var(--faint)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--cream-dim)', lineHeight: 1, marginBottom: 12 }}>{n}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,2.5vw,28px)', letterSpacing: 2, color: 'var(--cream)', marginBottom: 14 }}>{title}</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)', lineHeight: 1.8 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* PLANOS */}
      <div style={{ borderBottom: '1px solid var(--faint)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '20px var(--px)', borderBottom: '1px solid var(--faint)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,64px)', letterSpacing: 3, color: 'var(--red)' }}>PLANOS</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)' }}>Sem fidelidade. Cancele quando quiser.</p>
        </div>

        <div className="plans-grid">
          {/* PROFANO */}
          <div className="plan-col">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20, display: 'block' }}>Acesso Livre</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,6vw,72px)', color: 'var(--cream)', letterSpacing: 2, lineHeight: 1 }}>R$0</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2 }}>/mês</span>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,32px)', letterSpacing: 4, color: 'var(--muted)', marginBottom: 24 }}>PROFANO</p>
            <div style={{ height: 1, background: 'var(--faint)', margin: '24px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              {PLAN_FEATURES.profano.map(({ check, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.5vw,16px)', color: 'var(--muted)', lineHeight: 1.5 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginTop: 3 }}>{check ? '◉' : '○'}</span>
                  <span dangerouslySetInnerHTML={{ __html: text }} />
                </div>
              ))}
            </div>
            <Link href="/login?tab=register" style={{ display: 'block', width: '100%', marginTop: 32, padding: 16, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', textDecoration: 'none', transition: 'all .2s' }}>
              Criar conta grátis
            </Link>
          </div>

          {/* INICIADO */}
        <div className="plan-col" style={{ background: 'linear-gradient(135deg,var(--surface),rgba(130,111,18,.05))' }}>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--gold-dim)', padding: '4px 12px', display: 'inline-block', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -20, right: 0, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, background: 'var(--gold)', color: '#fff', padding: '2px 8px' }}>POPULAR</span>
                ◈ Assinante
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,6vw,72px)', color: 'var(--cream)', letterSpacing: 2, lineHeight: 1 }}>R$19,99</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2 }}>/mês</span>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,32px)', letterSpacing: 4, color: 'var(--gold)', marginBottom: 24 }}>INICIADO</p>
            <div style={{ height: 1, background: 'var(--gold)', margin: '24px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              {PLAN_FEATURES.iniciado.map(({ check, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.5vw,16px)', color: 'var(--muted)', lineHeight: 1.5 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)', flexShrink: 0, marginTop: 3 }}>◉</span>
                  <span dangerouslySetInnerHTML={{ __html: text }} />
                </div>
              ))}
            </div>
            {isSubscriber
              ? <ActivePlanBadge fullWidth />
              : <CheckoutButton label="Assinar Iniciado →" fullWidth />
            }
          </div>
        </div>
      </div>

      {/* COMPARE TABLE — horizontal scroll on mobile */}
      <div style={{ borderBottom: '1px solid var(--faint)' }}>
        <div className="section-div"><div className="sdiv-line" /><span className="sdiv-sym">◈</span><span className="sdiv-text">Comparação mais Detalhada</span><div className="sdiv-line" /></div>

        <div className="compare-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', padding: '16px var(--px)', borderBottom: '1px solid var(--faint)', textAlign: 'left' }}>Recurso</th>
                <th style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', padding: '16px 40px', borderBottom: '1px solid var(--faint)', textAlign: 'center', width: 160 }}>Profano</th>
                <th style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', padding: '16px 40px', borderBottom: '1px solid var(--faint)', textAlign: 'center', width: 160 }}>Iniciado</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(({ label, profano, iniciado }, i) => (
                <tr key={i}>
                  <td style={{ padding: '14px var(--px)', borderBottom: '1px solid var(--faint)', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)' }}>{label}</td>
                  <td style={{ padding: '14px 40px', borderBottom: '1px solid var(--faint)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {typeof profano === 'boolean'
                      ? <span style={{ color: profano ? 'var(--red)' : 'var(--faint)' }}>{profano ? '◉' : '○'}</span>
                      : <span style={{ color: 'var(--cream)' }}>{profano}</span>}
                  </td>
                  <td style={{ padding: '14px 40px', borderBottom: '1px solid var(--faint)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {typeof iniciado === 'boolean'
                      ? <span style={{ color: iniciado ? 'var(--red)' : 'var(--faint)' }}>{iniciado ? '◉' : '○'}</span>
                      : <span style={{ color: 'var(--cream)' }}>{iniciado}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <HermesBot message="Dúvidas sobre os planos? O Iniciado oferece acesso completo — transmissões, quiz e 4 livros/mês." />
    </>
  )
}

function CheckoutButton({ label = 'Assinar →', fullWidth = false }: { label?: string; fullWidth?: boolean }) {
  return (
    <form action="/api/checkout" method="POST" style={{ marginTop: fullWidth ? 32 : 0, width: fullWidth ? '100%' : 'auto', display: 'inline-block' }}>
      <button type="submit" className="btn-primary" style={{ display: 'block', width: fullWidth ? '100%' : 'auto', textAlign: 'center' }}>
        {label}
      </button>
    </form>
  )
}

function ActivePlanBadge({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div style={{
      marginTop: fullWidth ? 32 : 0,
      width: fullWidth ? '100%' : 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      background: 'var(--gold)',
      gap: 10,
      padding: fullWidth ? '16px' : '12px 20px',
      border: '1px solid var(--gold-dim)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      letterSpacing: 3,
      textTransform: 'uppercase' as const,
      color: 'black',
      justifyContent: fullWidth ? 'center' : 'flex-start',
    }}>
      <span style={{ fontSize: 14 }}>◈</span>
      Plano Iniciado ativo
    </div>
  )
}
