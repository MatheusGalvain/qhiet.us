import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReadingProgress from '@/components/artigo/ReadingProgress'
import ReadingCompleteButton from '@/components/artigo/ReadingCompleteButton'
import PaywallOverlay from '@/components/artigo/PaywallOverlay'
import HermesQuiz from '@/components/artigo/HermesQuiz'
import HermesBot from '@/components/layout/HermesBot'
import CategoryTag from '@/components/ui/CategoryTag'
import Link from 'next/link'
import type { Transmissao, QuizQuestion } from '@/types'
import type { Metadata } from 'next'
import { formatDatePT, padNumber } from '@/lib/utils'

interface PageProps {
  params: { slug: string }
}

async function getData(slug: string) {
  const supabase = await createClient()
  const { data: transmissao } = await supabase
    .from('transmissoes').select('*').eq('slug', slug).single()
  if (!transmissao) return null

  const { data: { user } } = await supabase.auth.getUser()
  let isSubscriber = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('is_subscriber, is_admin').eq('id', user.id).single()
    isSubscriber = profile?.is_subscriber ?? profile?.is_admin ?? false
  }

  const { data: quiz } = await supabase
    .from('quizzes').select('*').eq('transmissao_id', transmissao.id).single()

  return { transmissao: transmissao as Transmissao, isSubscriber, quiz }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getData(params.slug)
  if (!data) return { title: 'Transmissão não encontrada' }
  return { title: data.transmissao.title, description: data.transmissao.excerpt }
}

export default async function ArtigoPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { transmissao: t, isSubscriber, quiz } = data
  const hasAccess = t.access === 'free' || isSubscriber

  // XP for reading = 60% of total xp_reward
  const readingXP = Math.round(t.xp_reward * 0.6)

  return (
    <>
      <ReadingProgress />

      {/* BREADCRUMB */}
      <div style={{
        padding: '14px var(--px)', borderBottom: '1px solid var(--faint)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
        color: 'var(--muted)', textTransform: 'uppercase', flexWrap: 'wrap',
      }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: 'var(--faint)' }}>›</span>
        <Link href="/transmissoes" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Transmissões</Link>
        <span style={{ color: 'var(--faint)' }}>›</span>
        <span>{padNumber(t.number)}</span>
      </div>

      {/* LAYOUT — sidebar moves below on mobile */}
      <div className="article-layout">

        {/* MAIN CONTENT */}
        <article style={{
          padding: 'clamp(32px, 5vw, 56px) clamp(20px, 5vw, 64px) 80px',
          position: 'relative',
          borderRight: '1px solid var(--faint)',
        }}>
          {/* Categories */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {t.categories.map(cat => (
              <CategoryTag key={cat} category={cat} linked />
            ))}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            letterSpacing: 2, lineHeight: 0.92,
            color: 'var(--cream)', marginBottom: 24,
          }}>
            {t.title}
          </h1>

          {/* Meta strip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            padding: '16px 0',
            borderTop: '1px solid var(--faint)', borderBottom: '1px solid var(--faint)',
            marginBottom: 40,
          }}>
            {[
              ['Nº', padNumber(t.number)],
              ['Publicado', formatDatePT(t.published_at)],
              ['Leitura', `${t.read_time_minutes} min`],
              ['XP', `+${t.xp_reward}`],
            ].map(([label, value], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {i > 0 && <span style={{ width: 1, height: 12, background: 'var(--faint)', display: 'inline-block', flexShrink: 0 }} />}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {label}: <span style={{ color: 'var(--cream)' }}>{value}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Body */}
          {hasAccess ? (
            <div
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: t.content }}
            />
          ) : (
            <>
              <div
                className="article-prose"
                dangerouslySetInnerHTML={{ __html: getPreview(t.content) }}
              />
              <PaywallOverlay />
            </>
          )}

          {/* Concluir Leitura button — at the bottom of article content */}
          {hasAccess && (
            <ReadingCompleteButton transmissaoId={t.id} xpReward={readingXP} />
          )}

          {/* Quiz */}
          {hasAccess && quiz && (
            <HermesQuiz
              transmissaoId={t.id}
              questions={quiz.questions as QuizQuestion[]}
              xpReward={quiz.xp_reward}
            />
          )}
        </article>

        {/* SIDEBAR — sticky on desktop, inline on mobile */}
        <aside className="article-sidebar">
          <ArticleSidebar transmissao={t} hasAccess={hasAccess} />
        </aside>
      </div>

      <HermesBot message={`Você está lendo "${t.title}". Explore mais transmissões sobre ${t.categories[0]}.`} />
    </>
  )
}

function getPreview(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = text.split(' ').slice(0, 80).join(' ')
  return `<p>${words}…</p>`
}

function ArticleSidebar({ transmissao: t, hasAccess }: { transmissao: Transmissao; hasAccess: boolean }) {
  return (
    <>
      {/* Access status */}
      <div style={{ border: '1px solid var(--faint)', padding: 20, marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: t.access === 'free' ? 'var(--red-dim)' : 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
          {t.access === 'free' ? '◉ Leitura Livre' : '◈ Exclusivo Iniciados'}
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2vw, 28px)', letterSpacing: 2, color: 'var(--cream)', lineHeight: 1.1 }}>
          {t.title}
        </p>
      </div>

      {/* XP info */}
      <div style={{ border: '1px solid var(--faint)', padding: 20, marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Recompensas</p>
        {[
          ['Leitura', Math.round(t.xp_reward * 0.6)],
          ['Quiz completo', Math.round(t.xp_reward * 0.4)],
        ].map(([label, xp]) => (
          <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--gold)', letterSpacing: 2 }}>+{xp} XP</span>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ border: '1px solid var(--faint)', padding: 20, marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Categorias</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {t.categories.map(cat => (
            <Link key={cat} href={`/categorias/${cat}`} style={{ textDecoration: 'none' }}>
              <CategoryTag category={cat} />
            </Link>
          ))}
        </div>
      </div>

      {!hasAccess && (
        <Link href="/membros" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
          Desbloquear →
        </Link>
      )}
    </>
  )
}
