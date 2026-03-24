import Hero from '@/components/home/Hero'
import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Transmissao } from '@/types'
import { padNumber, formatDatePT } from '@/lib/utils'

export const revalidate = 3600

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
  return diff
}

async function getData() {
  try {
    const supabase = await createClient()

    // Featured: most recent locked transmissão
    const { data: featured } = await supabase
      .from('transmissoes')
      .select('*')
      .eq('access', 'locked')
      .order('published_at', { ascending: false })
      .limit(1)
      .single()

    // Grid: 3 most recent free transmissões
    const { data: grid } = await supabase
      .from('transmissoes')
      .select('*')
      .eq('access', 'free')
      .order('published_at', { ascending: false })
      .limit(3)

    // Counts
    const { count: totalCount } = await supabase
      .from('transmissoes')
      .select('*', { count: 'exact', head: true })

    // Countdown from site_settings
    const { data: settingRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'next_post_at')
      .single()

    const rawDate = settingRow?.value
    const nextPostDateStr: string | null =
      typeof rawDate === 'string' ? rawDate : rawDate ? String(rawDate) : null
    const nextPostDays = daysUntil(nextPostDateStr)

    return {
      featured: featured as Transmissao | null,
      grid: (grid ?? []) as Transmissao[],
      total: totalCount ?? 0,
      nextPostDays,
    }
  } catch {
    return { featured: null, grid: [], total: 212, nextPostDays: 7 }
  }
}

export default async function HomePage() {
  const { featured, grid, total, nextPostDays } = await getData()

  return (
    <>
      <Hero />

      {/* SECTION DIVIDER */}
      <div className="section-div">
        <div className="sdiv-line" />
        <span className="sdiv-sym">✦</span>
        <span className="sdiv-text">Portal Oculto · {total} Transmissões</span>
        <span className="sdiv-sym">✦</span>
        <div className="sdiv-line" />
      </div>

      {/* QUOTE SECTION */}
      <section className="quote-section">
        <div className="qs-left">
          <div className="qs-text">
            "Não busques a verdade fora de ti. O que procuras no mundo já habita, em silêncio, dentro de tua própria sombra."
          </div>
          <div className="qs-cite">— Evangelhos Gnósticos · Nag Hammadi · Séc. II</div>
        </div>
        <div className="qs-right">
          <div className="qs-tag">Sobre o Portal</div>
          <div className="qs-context">
            O QHIETHUS não é um repositório de curiosidades. É um caminho.<br /><br />
            Cada texto foi selecionado para conduzir o leitor um passo mais fundo — da superfície da tradição até o núcleo vivo do mistério que ela carrega.
          </div>
        </div>
      </section>

      {/* POSTS SECTION */}
      <section className="posts-section">
        {/* Header */}
        <div className="posts-header">
          <h2 className="posts-label">TRANSMISSÕES</h2>
          <span className="posts-count">[ {total} textos · 87 livros ]</span>
        </div>

        {/* Featured article */}
        {featured ? (
          <FeaturedArticle transmissao={featured} nextPostDays={nextPostDays} />
        ) : (
          <FeaturedArticleFallback nextPostDays={nextPostDays} />
        )}

        {/* 3-card grid */}
        <div className="articles-grid">
          {grid.length > 0
            ? grid.map(t => <GridCard key={t.id} post={t} />)
            : <FallbackGridCards />
          }
        </div>

        <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/transmissoes" style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
            color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase',
          }}>
            Ver todas as transmissões →
          </Link>
        </div>
      </section>

      {/* MEMBERSHIP SECTION */}
      <MembershipSection />

      <HermesBot message="Bem-vindo ao QHIETHUS. Explore as transmissões ou navegue pelas categorias para iniciar sua jornada." />
    </>
  )
}

/* ─── Countdown label helper ─── */
function countdownLabel(days: number | null): { line: string; num: string } {
  if (days === null) return { line: 'próximo conteúdo', num: 'Em breve' }
  if (days <= 0)     return { line: 'próximo conteúdo', num: 'Hoje' }
  if (days === 1)    return { line: 'próximo conteúdo', num: 'Amanhã' }
  return { line: 'próximo conteúdo', num: `em ${days} dias` }
}

/* ─── Featured Article ─── */
function FeaturedArticle({ transmissao: t, nextPostDays }: { transmissao: Transmissao; nextPostDays: number | null }) {
  const catLabel = t.categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' · ')
  const preview = t.excerpt || t.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 30).join(' ') + '…'
  const dateStr = formatDatePT(t.published_at).toUpperCase()
  const { line: cLine, num: cNum } = countdownLabel(nextPostDays)

  return (
    <Link href={`/artigo/${t.slug}`} className="article-featured">
      {/* Main content */}
      <div className="af-main">
        <p className="af-cat">{catLabel}</p>
        <h2 className="af-title">{t.title}</h2>
        <p className={`af-excerpt af-blurred`}>{preview}</p>

        {/* VIP center badge */}
        <div className="af-center-badge">
          <div className="af-veil-tag">
            <div className="af-veil-line-top" />
            <div className="af-veil-diamond" />
            <span className="af-veil-text">Assinantes</span>
            <div className="af-veil-diamond" />
            <div className="af-veil-line-bot" />
          </div>
          <span className="af-veil-sub">acesso exclusivo</span>
        </div>
      </div>

      {/* Right meta */}
      <div className="af-side">
        <div className="af-meta-block">
          {([
            ['Data', dateStr],
            ['Leitura', `${t.read_time_minutes} min`],
            ['Categoria', catLabel.split(' · ')[0]],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="af-meta-row">
              <span className="af-meta-label">{label}</span>
              <span className="af-meta-val">{value}</span>
            </div>
          ))}
        </div>

        <div className="af-next">
          <p className="af-next-label">{cLine}</p>
          <p className="af-next-days"><span>{cNum}</span></p>
          <div className="af-next-bar">
            <div className="af-next-fill" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function FeaturedArticleFallback({ nextPostDays }: { nextPostDays: number | null }) {
  const { line: cLine, num: cNum } = countdownLabel(nextPostDays)
  return (
    <div className="article-featured">
      <div className="af-main">
        <p className="af-cat">Cabala · Árvore da Vida</p>
        <h2 className="af-title">O Silêncio Entre os Véus:<br />Ain Soph e a Emanação do Ser</h2>
        <p className="af-excerpt af-blurred">
          Antes da criação, havia apenas o Sem Fim — o Ain Soph. Não um vazio, mas uma plenitude tão absoluta que nenhum nome pode alcançá-la.
        </p>
        <div className="af-center-badge">
          <div className="af-veil-tag">
            <div className="af-veil-line-top" />
            <div className="af-veil-diamond" />
            <span className="af-veil-text">Assinantes</span>
            <div className="af-veil-diamond" />
            <div className="af-veil-line-bot" />
          </div>
          <span className="af-veil-sub">acesso exclusivo</span>
        </div>
      </div>
      <div className="af-side">
        <div className="af-meta-block">
          {([['Data', 'MAR 2026'], ['Leitura', '14 min'], ['Categoria', 'Cabala']] as [string, string][]).map(([l, v]) => (
            <div key={l} className="af-meta-row">
              <span className="af-meta-label">{l}</span>
              <span className="af-meta-val">{v}</span>
            </div>
          ))}
        </div>
        <div className="af-next">
          <p className="af-next-label">{cLine}</p>
          <p className="af-next-days"><span>{cNum}</span></p>
          <div className="af-next-bar">
            <div className="af-next-fill" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Grid Card ─── */
function GridCard({ post }: { post: Transmissao }) {
  const catLabel = post.categories[0]
    ? post.categories[0].charAt(0).toUpperCase() + post.categories[0].slice(1)
    : ''
  return (
    <Link href={`/artigo/${post.slug}`} className="ag-card">
      <div className="ag-num">{padNumber(post.number)}</div>
      <div className="ag-cat">
        <span>{catLabel}</span>
        <span className="ag-time">{post.read_time_minutes} min</span>
      </div>
      <h3 className="ag-title">{post.title}</h3>
      <span className={`ag-status ${post.access === 'free' ? 'free' : 'paid'}`}>
        {post.access === 'free' ? '◉ LEITURA LIVRE' : '◈ ASSINANTES'}
      </span>
    </Link>
  )
}

function FallbackGridCards() {
  const cards = [
    { num: 1, title: 'A Mente como Primeiro Princípio', cat: 'Hermetismo', mins: 8, access: 'free' },
    { num: 2, title: 'Os Arquontes e o Deus Demiurgo de Valentino', cat: 'Gnosticismo', mins: 11, access: 'free' },
    { num: 3, title: 'Nigredo: A Putrefação Necessária do Ego', cat: 'Alquimia', mins: 6, access: 'free' },
  ]
  return (
    <>
      {cards.map(p => (
        <div key={p.num} className="ag-card">
          <div className="ag-num">{padNumber(p.num)}</div>
          <div className="ag-cat">
            <span>{p.cat}</span>
            <span className="ag-time">{p.mins} min</span>
          </div>
          <h3 className="ag-title">{p.title}</h3>
          <span className="ag-status free">◉ LEITURA LIVRE</span>
        </div>
      ))}
    </>
  )
}

/* ─── Membership Section ─── */
function MembershipSection() {
  return (
    <section className="membership">
      {/* Left — plans */}
      <div className="mem-left">
        <h2 className="mem-display">ASCEN<span>DA</span></h2>
        <p className="mem-desc">
          Dois caminhos se abrem diante do buscador. O primeiro, livre — para os que chegam. O segundo, para os que escolhem permanecer.
        </p>

        <div className="plans">
          {/* Profano */}
          <div className="plan">
            <p className="plan-name">Profano</p>
            <div>
              <span className="plan-price">R$ 0</span>
              <span className="plan-period"> / gratuito</span>
            </div>
            <div className="plan-features">
              {['Textos introdutórios', '1 livro/mês por e-mail', 'Newsletter mensal'].map(f => (
                <p key={f} className="plan-feature">{f}</p>
              ))}
            </div>
            <Link href="/login" className="plan-cta">Entrar</Link>
          </div>

          {/* Iniciado (featured) */}
          <div className="plan featured">
            <p className="plan-name">Iniciado</p>
            <div>
              <span className="plan-price">R$19,99</span>
              <span className="plan-period"> / por mês</span>
            </div>
            <div className="plan-features">
              {['Acesso completo', '4 livros/mês', 'Trilhas de estudo', 'Acesso antecipado'].map(f => (
                <p key={f} className="plan-feature">{f}</p>
              ))}
            </div>
            <Link href="/membros" className="plan-cta">Ascender →</Link>
          </div>
        </div>
      </div>

      {/* Right — book of the month */}
      <div className="mem-right">
        <div>
          <p className="book-label">// Livro do Mês · Março 2026</p>
          <div className="book-card">
            <div className="book-cover">
              THE<br />KYBALION<br /><br />✦
            </div>
            <div>
              <p className="book-title">The Kybalion</p>
              <span className="book-author">THREE INITIATES · 1908</span>
              <p className="book-desc">
                Os sete princípios herméticos que governam toda a existência. Texto fundador da tradição ocidental moderna — enviado diretamente ao seu e-mail ao se inscrever.
              </p>
            </div>
          </div>
        </div>

        <div className="readbook">
          <div className="rb-item">
            <span className="rb-tag free">◉ LEITURA LIVRE</span>
            <p className="rb-text">Acesso ao conteúdo introdutório. Um livro por mês enviado por e-mail ao se cadastrar gratuitamente.</p>
          </div>
          <div className="rb-item">
            <span className="rb-tag paid">◈ PLANO INICIADO</span>
            <p className="rb-text">Acesso completo ao portal, 4 livros por mês + guias exclusivos de estudo.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
