import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategoryLabelMap } from '@/lib/getCategoryLabelMap'
import TransmissaoCard from '@/components/transmissoes/TransmissaoCard'
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

  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single()
    isAdmin = profile?.is_admin ?? false
  }

  const { data: transmissao } = await supabase
    .from('transmissoes').select('*').eq('slug', slug).single()
  if (!transmissao) return null

  // Block direct URL access to drafts — only admins can preview unpublished articles
  if (transmissao.status !== 'published' && !isAdmin) return null

  // isSubscriber: re-use the profile query above (isAdmin already fetched)
  // We need is_subscriber — fetch it now (profile was select('is_admin') above)
  let isSubscriber = isAdmin // admins always have access
  if (user && !isAdmin) {
    const { data: subProfile } = await supabase
      .from('profiles').select('is_subscriber').eq('id', user.id).single()
    isSubscriber = subProfile?.is_subscriber ?? false
  }

  const hasAccess = transmissao.access === 'free' || isSubscriber

  const { data: quiz } = await supabase
    .from('quizzes').select('*').eq('transmissao_id', transmissao.id).single()

  // ─── SECURITY: Never send protected content to the browser for non-subscribers ───
  // Client component props are serialized into __NEXT_DATA__ and visible in DevTools.
  // Strip content and quiz answers server-side so they never leave the server.
  const safeTransmissao: Transmissao = hasAccess
    ? (transmissao as Transmissao)
    : { ...(transmissao as Transmissao), content: '' }

  const safeQuizQuestions: QuizQuestion[] = hasAccess && quiz
    ? (quiz.questions as QuizQuestion[])
    : []
  // ─────────────────────────────────────────────────────────────────────────────────
  const { data: transmissoes } = await supabase
    .from('transmissoes')
    .select('*')
    .eq('status', 'published')
    .neq('id', transmissao.id)
    .limit(6)
  return { transmissao: safeTransmissao, transmissoes: transmissoes ?? [], isSubscriber, hasAccess, quiz, safeQuizQuestions }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getData(params.slug)
  if (!data) return { title: 'Transmissão não encontrada' }
  return { title: data.transmissao.title, description: data.transmissao.excerpt }
}

export default async function ArtigoPage({ params }: PageProps) {
  const [data, labelMap] = await Promise.all([getData(params.slug), getCategoryLabelMap()])
  if (!data) notFound()

  const { transmissao: t, transmissoes, isSubscriber, hasAccess, quiz, safeQuizQuestions } = data

  // XP for reading = 60% of total xp_reward
  const readingXP = t.xp_reward

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
              <CategoryTag key={cat} category={cat} linked labelMap={labelMap} />
            ))}
          </div>

          {/* Title */}
          <h1 className="article-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            letterSpacing: 2, lineHeight: 0.92, marginBottom: 24,
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
                  <span className="article-color" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {label}: <span className="article-color">{value}</span>
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
              questions={safeQuizQuestions}
              xpReward={quiz.xp_reward}
              hasAccess={hasAccess}
            />
          )}
        </article>

        {/* SIDEBAR — sticky on desktop, inline on mobile */}
        <aside className="article-sidebar">
          <ArticleSidebarClient
            transmissao={t}
            hasAccess={hasAccess}
            isFree={t.access === 'free'}
            quizXpReward={quiz?.xp_reward ?? null}
            questionCount={quiz ? (quiz.questions as any[]).length : 0}
            hasQuiz={!!quiz}
          />
        </aside>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px var(--px)', borderBottom: '1px solid var(--faint)', marginTop: 0 }}>
        <Link href="/transmissoes" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Todas as Transmissões
        </Link>
      </div>
      <div className="grid-3col section-pad">
          {transmissoes.slice(0, 3).map(t => (
            <TransmissaoCard key={t.id} transmissao={t} isSubscriber={isSubscriber} />
          ))}

          {transmissoes.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '64px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
                Em breve — transmissões chegando
              </p>
            </div>
          )}
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
