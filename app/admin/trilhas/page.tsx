import { createServiceClient } from '@/lib/supabase/server'
import TrailsManager from '@/components/admin/TrailsManager'

export const revalidate = 0

async function getTrails() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('trails')
    .select('*, trail_transmissoes(count)')
    .order('order_index')
  return data ?? []
}

async function getCategories() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('categories')
    .select('slug, label')
    .eq('active', true)
    .order('sort_order')
  return data ?? []
}

export default async function AdminTrilhasPage() {
  const [trails, categories] = await Promise.all([getTrails(), getCategories()])

  const published = trails.filter((t: any) => t.is_published).length
  const drafts    = trails.length - published

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
            Iniciação
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
            Trilhas
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', marginTop: 8 }}>
            {trails.length} trilhas · {published} publicadas · {drafts} rascunhos
          </p>
        </div>
      </div>

      <div style={{ padding: '16px 20px', border: '1px solid var(--faint)', marginBottom: 40, background: 'var(--surface)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
          <span style={{ color: 'var(--red-dim)' }}>// </span>Sobre as trilhas
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Exclusivo para <span style={{ color: 'var(--gold)' }}>Iniciados</span>. Transmissões de trilha são independentes das transmissões públicas — não aparecem em /transmissoes.<br />
          O XP só é liberado ao concluir <span style={{ color: 'var(--cream)' }}>todas</span> as transmissões da trilha.
        </p>
      </div>

      <TrailsManager initialTrails={trails} categories={categories} />
    </div>
  )
}
