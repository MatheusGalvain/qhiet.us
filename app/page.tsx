import Hero from '@/components/home/Hero'
import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Transmissao } from '@/types'
import { padNumber, getCategorySymbol, formatDatePT } from '@/lib/utils'

export const revalidate = 3600

async function getRecentTransmissoes(): Promise<Transmissao[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('transmissoes')
      .select('*')
      .eq('access', 'free')
      .order('published_at', { ascending: false })
      .limit(6)
    return data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const transmissoes = await getRecentTransmissoes()

  return (
    <>
      <Hero />

      {/* SECTION DIVIDER */}
      <div className="section-div">
        <div className="sdiv-line" />
        <span className="sdiv-sym">☿</span>
        <span className="sdiv-text">Transmissões Recentes</span>
        <div className="sdiv-line" />
      </div>

      {/* QUOTE SECTION */}
      <section className="quote-section">
        <div className="qs-left" style={{ borderRight: '1px solid var(--faint)', paddingRight: 56 }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(20px, 2.5vw, 32px)',
            color: 'var(--cream)',
            lineHeight: 1.45,
            borderLeft: '2px solid var(--red)',
            paddingLeft: 24,
          }}>
            "A ignorância é a mãe de todos os males — e o conhecimento, a única redenção possível."
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', marginTop: 14, paddingLeft: 26 }}>
            — Evangelhos Gnósticos · Nag Hammadi
          </p>
        </div>
        <div className="qs-right" style={{ paddingLeft: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px, 1.5vw, 17px)', color: 'var(--muted)', lineHeight: 1.8 }}>
            O QHIETHUS é um portal dedicado ao estudo dos mistérios ocultos — uma biblioteca viva de transmissões sobre as grandes tradições esotéricas ocidentais. Aqui, o conhecimento não é decoração: é transformação.
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--red)', textTransform: 'uppercase' }}>
            <span style={{ width: 20, height: 1, background: 'var(--red)', display: 'inline-block', flexShrink: 0 }} />
            Hermetismo · Cabala · Gnosticismo · Alquimia
          </span>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="section-pad">
        <div className="posts-header" style={{ marginBottom: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: 4, color: 'var(--cream)' }}>
            TRANSMISSÕES RECENTES
          </h2>
          <Link href="/transmissoes" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Ver todas →
          </Link>
        </div>

        <div className="grid-3col">
          {transmissoes.length > 0
            ? transmissoes.map(t => <HomePostCard key={t.id} post={t} />)
            : <FallbackPosts />
          }
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner-grid">
        <div style={{ padding: 'clamp(40px, 5vw, 64px) var(--px)', borderRight: '1px solid var(--faint)' }}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>Plano Iniciado</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5vw, 56px)', letterSpacing: 3, color: 'var(--cream)', lineHeight: 1, marginBottom: 16 }}>
            ALÉM DO<br /><span style={{ color: 'var(--red)' }}>VÉU</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px, 1.5vw, 17px)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 360, marginBottom: 32 }}>
            Acesso ilimitado a todas as transmissões, quiz de IA Hermes e 4 livros mensais curados.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/membros" className="btn-primary">Assinar por R$29/mês →</Link>
            <Link href="/login" className="btn-secondary">Criar conta grátis</Link>
          </div>
        </div>
        <div style={{ padding: 'clamp(40px, 5vw, 64px) var(--px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
          {[
            ['◉', 'Leitura livre', 'Acesso a todas as transmissões da categoria Leitura Livre'],
            ['◈', 'Exclusivo Iniciado', 'Transmissões premium, quiz de IA e 4 livros mensais por e-mail'],
            ['✦', 'XP & Rank global', 'Acumule XP por leitura e quiz. Suba no ranking entre os membros'],
          ].map(([sym, title, desc]) => (
            <div key={title as string} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--gold)', opacity: 0.6, paddingTop: 2, flexShrink: 0 }}>{sym}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2vw, 20px)', letterSpacing: 2, color: 'var(--cream)', marginBottom: 4 }}>{title}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <HermesBot message="Bem-vindo ao QHIETHUS. Explore as transmissões ou navegue pelas categorias para iniciar sua jornada." />
    </>
  )
}

/* ─── Post Card ─── */
function HomePostCard({ post }: { post: Transmissao }) {
  return (
    <Link href={`/artigo/${post.slug}`} style={{ textDecoration: 'none' }}>
      <article
        style={{
          padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 28px)',
          borderRight: '1px solid var(--faint)',
          borderBottom: '1px solid var(--faint)',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 10,
          transition: 'background .3s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(176,42,30,.025)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: post.access === 'free' ? 'var(--red-dim)' : 'var(--gold)' }}>
            {post.access === 'free' ? '◉ Leitura Livre' : '◈ Assinantes'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1, color: 'var(--muted)', border: '1px solid var(--faint)', padding: '3px 9px', whiteSpace: 'nowrap' }}>
            est. <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--cream)', verticalAlign: 'middle' }}>{post.read_time_minutes} min</span>
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4vw, 52px)', color: 'var(--faint)', lineHeight: 1 }}>
          {padNumber(post.number)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {post.categories.map(cat => (
            <span key={cat} className="cat-tag-inline">
              <span className="cat-sym">{getCategorySymbol(cat)}</span>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </span>
          ))}
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2vw, 20px)', letterSpacing: 1, lineHeight: 1.2, color: 'var(--cream)' }}>
          {post.title}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#b8b8b8', lineHeight: 1.75, flex: 1 }}>
          {post.excerpt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--faint)', marginTop: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>
            {formatDatePT(post.published_at)}
          </span>
        </div>
      </article>
    </Link>
  )
}

/* ─── Fallback (static) ─── */
function FallbackPosts() {
  const posts = [
    { num: '002', title: 'A Mente como Primeiro Princípio', excerpt: 'O primeiro princípio hermético afirma que o universo é de natureza mental. Toda realidade existe na mente do Todo.', cats: [{ sym: '☿', name: 'Hermetismo' }], date: '15 Mar 2026', mins: 8 },
    { num: '003', title: 'Os Arquontes e o Deus Demiurgo de Valentino', excerpt: 'Para Valentino, o deus criador do mundo não era o Deus supremo, mas um ser menor, ignorante de sua própria inferioridade.', cats: [{ sym: '⊕', name: 'Gnosticismo' }], date: '08 Mar 2026', mins: 11 },
    { num: '004', title: 'Nigredo: A Putrefação Necessária do Ego', excerpt: 'O primeiro estágio alquímico representa a dissolução — a morte simbólica do eu superficial antes da transformação genuína.', cats: [{ sym: '☽', name: 'Alquimia' }], date: '01 Mar 2026', mins: 6 },
  ]

  return (
    <>
      {posts.map(p => (
        <article key={p.num} style={{ padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 28px)', borderRight: '1px solid var(--faint)', borderBottom: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--red-dim)' }}>◉ Leitura Livre</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1, color: 'var(--muted)', border: '1px solid var(--faint)', padding: '3px 9px' }}>
              est. <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--cream)', verticalAlign: 'middle' }}>{p.mins} min</span>
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4vw, 52px)', color: 'var(--faint)', lineHeight: 1 }}>{p.num}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {p.cats.map(c => (
              <span key={c.name} className="cat-tag-inline"><span className="cat-sym">{c.sym}</span>{c.name}</span>
            ))}
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2vw, 20px)', letterSpacing: 1, lineHeight: 1.2, color: 'var(--cream)' }}>{p.title}</h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#b8b8b8', lineHeight: 1.75 }}>{p.excerpt}</p>
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--faint)', marginTop: 'auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>{p.date}</span>
          </div>
        </article>
      ))}
    </>
  )
}
