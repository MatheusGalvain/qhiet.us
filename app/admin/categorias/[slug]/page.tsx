import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { CATEGORY_META } from '@/types'
import CategoryContentEditor from '@/components/admin/CategoryContentEditor'

interface PageProps { params: { slug: string } }

async function getData(slug: string) {
  const supabase = createServiceClient()

  // Try DB first, fall back to CATEGORY_META
  let meta: { label: string; symbol: string; color: string; sort_order: number; tags: string[] } | null = null
  try {
    const { data: dbCat } = await supabase
      .from('categories')
      .select('label, symbol, color, sort_order, tags')
      .eq('slug', slug)
      .single()
    if (dbCat) meta = {
      label:      dbCat.label      ?? '',
      symbol:     dbCat.symbol     ?? '◉',
      color:      dbCat.color      ?? '#b02a1e',
      sort_order: dbCat.sort_order ?? 99,
      tags:       dbCat.tags       ?? [],
    }
  } catch {}

  if (!meta) {
    const fallback = CATEGORY_META[slug as keyof typeof CATEGORY_META]
    if (!fallback) return null
    meta = { label: fallback.label, symbol: fallback.symbol, color: '#b02a1e', sort_order: 99, tags: [] }
  }

  const { data: content } = await supabase
    .from('category_content')
    .select('*')
    .eq('category', slug)
    .single()

  return { meta, content: content ?? null }
}

export default async function AdminCategoryEditorPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { meta, content } = data

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
          Admin · Editar Categoria
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: meta.color, opacity: 0.7 }}>{meta.symbol}</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
            {meta.label.toUpperCase()}
          </h1>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', marginTop: 8 }}>
          /categorias/{params.slug}
        </p>
      </div>

      <CategoryContentEditor
        slug={params.slug}
        initialContent={content}
        initialMeta={meta}
      />
    </div>
  )
}
