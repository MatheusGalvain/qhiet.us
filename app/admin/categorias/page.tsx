import DeleteButton from '@/components/admin/DeleteButton';
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface DbCategory { id: string, slug: string; label: string; symbol: string; color: string; sort_order: number }
interface DbTransmissao { categories: string[] | null; status: string; access: string }

export const revalidate = 0

export default async function AdminCategoriasPage() {
  const supabase = createServiceClient()

  const [{ data: transmissoes }, { data: dbCategories }] = await Promise.all([
    supabase.from('transmissoes').select('categories, status, access'),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  const list: DbTransmissao[] = (transmissoes ?? []) as DbTransmissao[]
  // Fall back to empty array if categories table doesn't exist yet
  const cats: DbCategory[] = (dbCategories ?? []) as DbCategory[]

  // Count per category slug
  const counts: Record<string, { total: number; published: number; free: number; locked: number }> = {}
  for (const c of cats) {
    counts[c.slug] = { total: 0, published: 0, free: 0, locked: 0 }
  }
  for (const t of list) {
    for (const cat of (t.categories ?? [])) {
      if (!counts[cat]) counts[cat] = { total: 0, published: 0, free: 0, locked: 0 }
      counts[cat].total++
      if (t.status === 'published') counts[cat].published++
      if (t.access === 'free') counts[cat].free++
      else counts[cat].locked++
    }
  }

  interface SortedCat extends DbCategory { total: number; published: number; free: number; locked: number }
  const sorted: SortedCat[] = cats.map(c => ({ ...c, ...(counts[c.slug] ?? { total: 0, published: 0, free: 0, locked: 0 }) }))
  const maxCount = Math.max(...sorted.map((c: SortedCat) => c.total), 1)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
            Taxonomia
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
            Categorias
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', marginTop: 8 }}>
            {cats.length} categorias · {list.length} transmissões
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/admin/categorias/nova" className="btn-secondary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + Nova Categoria
          </Link>
          <Link href="/admin/transmissoes/nova" className="btn-secondary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + Nova Transmissão
          </Link>
        </div>
      </div>

      {cats.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 24 }}>
            Nenhuma categoria no banco. Rode o SQL de migração ou crie uma nova.
          </p>
          <Link href="/admin/categorias/nova" className="btn-secondary" style={{ textDecoration: 'none' }}>
            + Criar primeira categoria
          </Link>
        </div>
      )}

      {/* Category cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map(({ id, slug, label, symbol, color, total, published, free, locked }) => (
          <div key={slug} style={{ border: `1px solid ${total > 0 ? 'var(--faint)' : 'var(--faint)'}`, padding: '24px 28px', borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px 80px 80px', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              {/* Symbol */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color, opacity: total > 0 ? 0.9 : 0.4, textAlign: 'center' }}>
                {symbol}
              </span>

              {/* Name */}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, color: 'var(--cream)', marginBottom: 2 }}>
                  {label}
                </p>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Link href={`/categorias/${slug}`} target="_blank" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
                    /categorias/{slug} ↗
                  </Link>
                  <Link href={`/admin/categorias/${slug}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', textDecoration: 'none', textTransform: 'uppercase', border: '1px solid var(--red-dim)', padding: '2px 8px' }}>
                    Editar conteúdo →
                  </Link>
                  <DeleteButton id={id} title={slug} endpoint="categories"/>
                </div>
              </div>

              {/* Stats */}
              {[['total', total, 'var(--cream)'], ['publicadas', published, 'var(--gold)'], ['livres', free, 'var(--muted)'], ['assinante', locked, 'var(--red)']].map(([lbl, val, clr]) => (
                <div key={lbl as string} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, color: clr as string, lineHeight: 1, opacity: (val as number) > 0 ? 1 : 0.2 }}>{val as number}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>{lbl as string}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'var(--faint)', borderRadius: 1 }}>
              <div style={{ height: '100%', width: `${Math.round((total / maxCount) * 100)}%`, background: color, borderRadius: 1, transition: 'width .3s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
