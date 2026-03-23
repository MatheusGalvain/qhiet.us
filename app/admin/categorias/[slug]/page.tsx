import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { CATEGORY_META } from '@/types'
import CategoryContentEditor from '@/components/admin/CategoryContentEditor'

interface PageProps { params: { slug: string } }

async function getData(slug: string) {
  const meta = CATEGORY_META[slug as keyof typeof CATEGORY_META]
  if (!meta) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('category_content')
    .select('*')
    .eq('category', slug)
    .single()

  return { meta, content: data ?? null }
}

export default async function AdminCategoryEditorPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { meta, content } = data

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
          Admin · Conteúdo da Categoria
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--gold)', opacity: 0.6 }}>{meta.symbol}</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
            {meta.label.toUpperCase()}
          </h1>
        </div>
      </div>

      <CategoryContentEditor slug={params.slug} initialContent={content} />
    </div>
  )
}
