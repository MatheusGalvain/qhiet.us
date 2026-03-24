import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReadingProgress from '@/components/artigo/ReadingProgress'
import ReadingCompleteButton from '@/components/artigo/ReadingCompleteButton'
import PaywallOverlay from '@/components/artigo/PaywallOverlay'
import HermesQuiz from '@/components/artigo/HermesQuiz'
import ArticleSidebarClient from '@/components/artigo/ArticleSidebarClient'
import ArticleReadingTheme from '@/components/artigo/ArticleReadingTheme'
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
        <article id="article-content" style={{
          padding: 'clamp(32px, 5vw, 56px) clamp(20px, 5vw, 64px) 80px',
          position: 'relative',
          borderRight: '1px solid var(--faint)',
          transition: 'background .3s, color .3s',
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
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            padding: '16px 0',
            borderTop: '1px solid var(--faint)', borderBottom: '1px solid var(--faint)',
            marginBottom: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
            <ArticleReadingTheme />
          </div>

          {/* Body */}
          {hasAccess ? (
            <div
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: t.content }}
            />
          ) : (
            <PaywallOverlay />
          )}

          {/* Marker: progress tracks up to this point */}
          <div id="article-end" style={{ height: 90 }} />

          {/* Concluir Leitura button — at the bottom of article content */}
          {hasAccess && (
            <ReadingCompleteButton transmissaoId={t.id} xpReward={readingXP} />
          )}

          {/* Quiz — shown always when quiz exists; locked state for non-subscribers */}
          {quiz && (
            <HermesQuiz
              transmissaoId={t.id}
              questions={quiz.questions as QuizQuestion[]}
              xpReward={quiz.xp_reward}
              hasAccess={hasAccess}
            />
          )}
        </article>

        {/* SIDEBAR — sticky on desktop, inline on mobile */}
        <aside className="article-sidebar">
          <ArticleSidebarClient transmissao={t} hasAccess={hasAccess} isFree={t.access === 'free'} />
        </aside>
      </div>

      <HermesBot message={`Você está lendo "${t.title}". Explore mais transmissões sobre ${t.categories[0]}.`} />
    </>
  )
}

function getPreview(html: string): string {
  // Extract first 4 block-level elements preserving HTML formatting
  const blockRe = /<(p|h2|h3|blockquote|ul|ol)(\s[^>]*)?>[\s\S]*?<\/\1>/gi
  const blocks = html.match(blockRe) ?? []
  if (blocks.length > 0) return blocks.slice(0, 4).join('\n')
  // Fallback: plain text
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return `<p>${text.split(' ').slice(0, 80).join(' ')}…</p>`
}
