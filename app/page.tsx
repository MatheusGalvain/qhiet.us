import Hero from '@/components/home/Hero'
import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Transmissao } from '@/types'
import { padNumber, formatDatePT } from '@/lib/utils'
import { getCategoryLabelMap, resolveCategoryLabel, resolveCategorySymbol } from '@/lib/getCategoryLabelMap'
import type { CategoryLabelMap } from '@/lib/getCategoryLabelMap'
import { canAccessAny, resolvePlans } from '@/lib/plans'

export const revalidate = 0

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

const month = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const currentDate = new Date();
const currentMonthIndex = currentDate.getMonth() + 1;
const currentMonthName = currentDate.toLocaleString('pt-BR', { month: 'long' });

async function getData() {
  try {
    const supabase = await createClient()

    // Check if current user is a subscriber (iniciado/adepto)
    let isSubscriber = false
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('plan, plans').eq('id', user.id).single()
      const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
      isSubscriber = canAccessAny(activePlans, 'transmissoes_exclusivas')
    }

    // Featured: most recent locked transmissão (never fetch content on list/home pages)
    const { data: featured } = await supabase
      .from('transmissoes')
      .select('id, slug, number, title, excerpt, categories, access, read_time_minutes, published_at, xp_reward, status')
      .eq('access', 'locked')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .single()

    // Grid: 3 most recent free transmissões (never fetch content for list views)
    const { data: grid } = await supabase
      .from('transmissoes')
      .select('id, slug, number, title, excerpt, categories, access, read_time_minutes, published_at, xp_reward, status')
      .eq('access', 'free')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)

    // Counts
    const { count: totalCount } = await supabase.from('transmissoes').select('*', { count: 'exact', head: true })

    // Counts
    const { count: totalCategories } = await supabase.from('categories').select('*', { count: 'exact', head: true })

    // Countdown: next draft transmissão with a scheduled published_at in the future
    const now = new Date().toISOString()
    const { data: nextDraft } = await supabase
      .from('transmissoes')
      .select('published_at')
      .eq('status', 'draft')
      .not('published_at', 'is', null)
      .gt('published_at', now)
      .order('published_at', { ascending: true })
      .limit(1)
      .single()

    const nextPostDays = daysUntil(nextDraft?.published_at)

    return {
      featured: featured as Transmissao | null,
      grid: (grid ?? []) as Transmissao[],
      total: totalCount ?? 0,
      totalcat: totalCategories ?? 0,
      nextPostDays,
      isSubscriber,
    }
  } catch {
    return { featured: null, grid: [], total: 1, totalcat: 1, nextPostDays: 7, isSubscriber: false }
  }
}

export default async function HomePage() {
  const [{ featured, grid, total, totalcat, nextPostDays, isSubscriber }, labelMap] = await Promise.all([getData(), getCategoryLabelMap()])

  return (
    <>
      <Hero totalTransmissoes={total} totalCategorias={totalcat}/>

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
          <span className="posts-count">[ {total} textos ]</span>
        </div>

        {/* Featured article */}
        {featured ? (
          <FeaturedArticle transmissao={featured} nextPostDays={nextPostDays} labelMap={labelMap} isSubscriber={isSubscriber} />
        ) : (
          <FeaturedArticleFallback nextPostDays={nextPostDays} />
        )}

        {/* 3-card grid */}
        <div className="articles-grid">
          {grid.length > 0
            ? grid.map(t => <GridCard key={t.id} post={t} labelMap={labelMap} />)
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

      {/* BANNER */}
      <section className='w-full py-3 lg:py-5'>
        <Link href="/transmissoes" >
          <img src="/assets/banner-reduce.png"></img>
        </Link>
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
function FeaturedArticle({ transmissao: t, nextPostDays, labelMap = {}, isSubscriber = false }: { transmissao: Transmissao; nextPostDays: number | null; labelMap?: CategoryLabelMap; isSubscriber?: boolean }) {
  const catLabel = t.categories.map(c => resolveCategoryLabel(c, labelMap)).join(' · ')
  const preview = t.excerpt || (t.content ? t.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 30).join(' ') + '…' : '…')
  const dateStr = formatDatePT(t.published_at).toUpperCase()
  const { line: cLine, num: cNum } = countdownLabel(nextPostDays)
  const isLocked = t.access === 'locked' && !isSubscriber

  return (
    <Link href={`/artigo/${t.slug}`} className="article-featured">
      {/* Main content */}
      <div className="af-main">
        <p className="af-cat">{catLabel}</p>
        <h2 className="af-title">{t.title}</h2>
        <p className={`af-excerpt${isLocked ? ' af-blurred' : ''}`}>{preview}</p>

        {/* VIP center badge — only show for non-subscribers */}
        {isLocked && (
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
        )}
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
function GridCard({ post, labelMap = {} }: { post: Transmissao; labelMap?: CategoryLabelMap }) {
  const catLabel = post.categories[0] ? resolveCategoryLabel(post.categories[0], labelMap) : ''
  return (
    <Link href={`/artigo/${post.slug}`} className="ag-card">
      <div className="ag-num">{padNumber(post.number)}</div>
      <div className="ag-cat">
        <span>{catLabel}</span>
        <span className="ag-time">est. {post.read_time_minutes} min</span>
      </div>
      <h3 className="ag-title">{post?.title}</h3>
      <span>{post?.excerpt}</span>
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
  const plans = [
    {
      name: 'Profano', price: 'R$ 0', period: 'gratuito',
      href: '/login', cta: 'Entrar', featured: false,
      features: [
        { on: true,  text: 'Transmissões de Leitura Livre' },
        { on: true,  text: 'Bot Hermes para instruir' },
        { on: true,  text: 'Perfil com XP' },
        { on: false, text: 'Transmissões exclusivas' },
        { on: false, text: 'Quiz & XP bônus' },
        { on: false, text: 'Trilhas de estudo' },
        { on: false, text: 'Grimório Digital' },
        { on: false, text: 'Acervo de livros PDF' },
      ],
    },
    {
      name: 'Iniciado', price: 'R$19,99', period: '/mês',
      href: '/membros', cta: 'Assinar →', featured: false,
      features: [
        { on: true, text: 'Tudo do plano Profano' },
        { on: true, text: 'Transmissões exclusivas' },
        { on: true, text: 'Quiz de Hermes + XP bônus' },
        { on: true, text: '4 livros mensais' },
        { on: true, text: 'Trilhas Exclusivas de estudo' },
        { on: true, text: 'Grimório Digital' },
        { on: true, text: 'Ranking global & Badges' },
        { on: false, text: 'Acervo de livros PDF' },
      ],
    },
    {
      name: 'Adepto', price: 'R$27,90', period: '/mês',
      href: '/membros?upgrade=adepto', cta: 'Assinar →', featured: true,
      badge: '✦ Recomendado',
      features: [
        { on: true, text: 'Tudo do plano Iniciado' },
        { on: true, text: 'Acervo completo de livros PDF' },
        { on: true, text: 'Leitor PDF inline com anotações' },
        { on: true, text: 'Progresso de leitura salvo' },
        { on: true, text: 'Hermetismo, Cabala, Alquimia…' },
        { on: true, text: 'Suporte prioritário' },
      ],
    },
    {
      name: 'Acervo', price: 'R$19,99', period: '/mês',
      href: '/membros?upgrade=acervo', cta: 'Assinar →', featured: false,
      features: [
        { on: true,  text: 'Transmissões de Leitura Livre' },
        { on: true,  text: 'Acervo completo de livros PDF' },
        { on: true,  text: 'Leitor PDF inline com anotações' },
        { on: true,  text: 'Progresso de leitura salvo' },
        { on: true,  text: 'Grimório Digital' },
        { on: false, text: 'Transmissões exclusivas' },
        { on: false, text: 'Trilhas & XP bônus' },
      ],
    },
  ]

  return (
    <section style={{ borderTop: '1px solid var(--faint)', borderBottom: '1px solid var(--faint)' }}>
      {/* Header */}
      <div style={{ padding: 'clamp(32px,4vw,56px) var(--px) clamp(20px,3vw,32px)', borderBottom: '1px solid var(--faint)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,7vw,80px)', letterSpacing: 4, color: 'var(--cream)', lineHeight: 1 }}>
          ASCEN<span style={{ color: 'var(--red)' }}>DA</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.4vw,17px)', color: 'var(--muted)', marginTop: 12, maxWidth: 560, lineHeight: 1.7 }}>
          Quatro caminhos se abrem diante do buscador. Do livre ao total — cada um com sua profundidade.
        </p>
      </div>

      {/* 4-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {plans.map((p, i) => (
          <div key={p.name} style={{
            padding: 'clamp(24px,3vw,40px) clamp(20px,2.5vw,36px)',
            borderRight: i < 3 ? '1px solid var(--faint)' : 'none',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
            background: p.featured ? 'linear-gradient(160deg, var(--surface), rgba(130,111,18,.07))' : 'transparent',
            outline: p.featured ? '1px solid rgba(212,175,55,0.35)' : 'none',
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

            <p className="plan-name" style={{ color: p.featured ? 'var(--gold)' : undefined }}>{p.name}</p>

            <div style={{ margin: '12px 0 8px' }}>
              <span className="plan-price">{p.price}</span>
              <span className="plan-period"> {p.period}</span>
            </div>

            <div style={{ flex: 1, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.features.map((f, fi) => (
                <div key={fi} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, flexShrink: 0, marginTop: 3,
                    color: f.on
                      ? (p.featured ? 'var(--gold)' : 'var(--red)')
                      : 'var(--cream-dim)',
                  }}>
                    {f.on ? '◉' : '○'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5,
                    color: f.on ? 'var(--cream)' : 'var(--cream-dim)',
                  }}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href={p.href}
              className="plan-cta"
              style={{ background: p.featured ? 'var(--gold)' : undefined, color: p.featured ? '#000' : undefined, textDecoration: 'none', display: 'block', textAlign: 'center' }}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
 