import { createServiceClient } from '@/lib/supabase/server'
import { CATEGORY_META } from '@/types'
import Link from 'next/link'

export const revalidate = 60

export default async function AdminCategoriasPage() {
  const supabase = createServiceClient()
  const { data: transmissoes } = await supabase
    .from('transmissoes')
    .select('categories, status, access')

  const list = transmissoes ?? []

  // Count per category
  const counts = Object.fromEntries(
    Object.keys(CATEGORY_META).map(key => [key, { total: 0, published: 0, free: 0, locked: 0 }])
  )

  for (const t of list) {
    for (const cat of (t.categories ?? [])) {
      if (!counts[cat]) continue
      counts[cat].total++
      if (t.status === 'published') counts[cat].published++
      if (t.access === 'free') counts[cat].free++
      else counts[cat].locked++
    }
  }

  const sorted = Object.entries(CATEGORY_META)
    .map(([key, meta]) => ({ key, meta, ...counts[key] }))
    .sort((a, b) => b.total - a.total)

  const maxCount = Math.max(...sorted.map(c => c.total), 1)

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
            {list.length} transmissões distribuídas em {sorted.filter(c => c.total > 0).length} categorias
          </p>
        </div>
        <Link href="/admin/transmissoes/nova" className="btn-secondary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
          + Nova Transmissão
        </Link>
      </div>

      {/* Category cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map(({ key, meta, total, published, free, locked }) => (
          <div key={key} style={{ border: '1px solid var(--faint)', padding: '24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px 80px 80px', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              {/* Symbol */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: total > 0 ? 'var(--red)' : 'var(--muted)', opacity: total > 0 ? 0.8 : 0.3, textAlign: 'center' }}>
                {meta.symbol}
              </span>

              {/* Name */}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, color: 'var(--cream)', marginBottom: 2 }}>
                  {meta.label}
                </p>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Link href={`/categorias/${meta.slug}`} target="_blank" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
                    /categorias/{meta.slug} ↗
                  </Link>
                  <Link href={`/admin/categorias/${meta.slug}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', textDecoration: 'none', textTransform: 'uppercase', border: '1px solid var(--red-dim)', padding: '2px 8px' }}>
                    Editar conteúdo →
                  </Link>
                </div>
              </div>

              {/* Total */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, color: 'var(--cream)', lineHeight: 1 }}>{total}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>total</p>
              </div>

              {/* Published */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, color: published > 0 ? 'var(--gold)' : 'var(--muted)', lineHeight: 1, opacity: published > 0 ? 1 : 0.3 }}>{published}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>publicadas</p>
              </div>

              {/* Free */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, color: 'var(--muted)', lineHeight: 1, opacity: free > 0 ? 0.8 : 0.2 }}>{free}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>livres</p>
              </div>

              {/* Locked */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, color: locked > 0 ? 'var(--red)' : 'var(--muted)', lineHeight: 1, opacity: locked > 0 ? 0.8 : 0.2 }}>{locked}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>assinante</p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'var(--faint)', borderRadius: 1 }}>
              <div style={{
                height: '100%',
                width: `${Math.round((total / maxCount) * 100)}%`,
                background: total > 0 ? 'var(--red)' : 'transparent',
                borderRadius: 1,
                transition: 'width .3s',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
