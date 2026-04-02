import { createServiceClient } from '@/lib/supabase/server'
import TransmissaoForm from '@/components/admin/TransmissaoForm'
import QuizEditor from '@/components/admin/QuizEditor'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function EditarTransmissaoPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const [{ data: transmissao }, { data: quiz }] = await Promise.all([
    supabase.from('transmissoes').select('*').eq('id', params.id).single(),
    supabase.from('quizzes').select('*').eq('transmissao_id', params.id).maybeSingle(),
  ])

  if (!transmissao) notFound()

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <Link href="/control/transmissoes" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
          ← Transmissões
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
            Editar Transmissão
          </h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
            #{String(transmissao.number).padStart(3, '0')}
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)', marginTop: 6 }}>
          {transmissao.title}
        </p>
      </div>

      <TransmissaoForm mode="edit" initial={transmissao} />

      <QuizEditor
        transmissaoId={params.id}
        initialQuiz={quiz ?? null}
      />
    </div>
  )
}
