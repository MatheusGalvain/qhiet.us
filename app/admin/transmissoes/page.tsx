import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeleteButton from '@/components/admin/DeleteButton'
import { CATEGORY_META } from '@/types'

export const revalidate = 0

type TRow = {
  id: string
  number: number
  title: string
  slug: string
  categories: string[]
  access: string
  status: string
  read_time_minutes: number
  published_at: string | null
}

export default async function AdminTransmissoesPage() {
  const supabase = createServiceClient()
  const { data: transmissoes } = await supabase
    .from('transmissoes')
    .select('id, number, title, slug, categories, access, status, read_time_minutes, published_at')
    .order('number', { ascending: false })

  const list = (transmissoes ?? []) as TRow[]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
            Conteúdo
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
            Transmissões
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', marginTop: 8 }}>
            {list.length} transmissões · {list.filter(t => t.status === 'published').length} publicadas
          </p>
        </div>
        <Link href="/admin/transmissoes/nova" className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
          + Nova Transmissão
        </Link>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--faint)' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 160px 100px 90px 100px 100px', gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--faint)', background: 'rgba(255,255,255,0.02)' }}>
          {['Nº', 'Título', 'Categorias', 'Acesso', 'Leitura', 'Status', ''].map(h => (
            <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
          ))}
        </div>

        {list.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
              Nenhuma transmissão ainda.{' '}
              <Link href="/admin/transmissoes/nova" style={{ color: 'var(--red)' }}>Criar a primeira →</Link>
            </p>
          </div>
        )}

        {list.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr 160px 100px 90px 100px 100px',
              gap: 15,
              padding: '14px 20px',
              borderBottom: i < list.length - 1 ? '1px solid var(--faint)' : 'none',
              alignItems: 'center',
              transition: 'background .1s',
            }}
          >
            {/* Number */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
              #{String(t.number).padStart(3, '0')}
            </span>

            {/* Title */}
            <div>
              <Link href={`/admin/transmissoes/${t.id}/editar`} style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--cream)', textDecoration: 'none', display: 'block', marginBottom: 3 }}>
                {t.title}
              </Link>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)' }}>/{t.slug}</span>
            </div>

            {/* Categories */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(t.categories ?? []).slice(0, 2).map((cat: string) => (
                <span key={cat} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)', border: '1px solid var(--faint)', padding: '2px 6px' }}>
                  {CATEGORY_META[cat as keyof typeof CATEGORY_META]?.symbol ?? cat}
                </span>
              ))}
            </div>

            {/* Access */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: t.access === 'free' ? 'var(--muted)' : 'var(--red)', border: `1px solid ${t.access === 'free' ? 'var(--faint)' : 'var(--red-dim)'}`, padding: '3px 8px', display: 'inline-block' }}>
              {t.access === 'free' ? 'livre' : 'assin.'}
            </span>

            {/* Read time */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
              {t.read_time_minutes} min
            </span>

            {/* Status */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: t.status === 'published' ? 'var(--gold)' : 'var(--muted)', border: `1px solid ${t.status === 'published' ? 'var(--gold)' : 'var(--faint)'}`, padding: '3px 8px', opacity: t.status === 'published' ? 1 : 0.6, display: 'inline-block' }}>
              {t.status === 'published' ? 'publicado' : 'rascunho'}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', flexDirection: 'column' }}>
              <Link href={`/admin/transmissoes/${t.id}/editar`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
                Edit.
              </Link>
              <DeleteButton id={t.id} title={t.title}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
