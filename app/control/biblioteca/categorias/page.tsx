import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import BibliotecaCategoriasManager from '@/components/admin/BibliotecaCategoriasManager'

export const revalidate = 0
export const metadata: Metadata = { title: 'Admin · Categorias da Biblioteca' }

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/control/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!(profile as any)?.is_admin) redirect('/control')

  const { data: categorias } = await service
    .from('biblioteca_categorias')
    .select('id, name, order_index')
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })

  return { categorias: categorias ?? [] }
}

export default async function BibliotecaCategoriasPage() {
  const { categorias } = await getData()

  return (
    <div>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--faint)',
        padding: 'clamp(24px,3vw,40px) var(--px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/control" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Admin</Link>
            {' › '}
            <Link href="/control/biblioteca" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Biblioteca</Link>
            {' › '}
            Categorias
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,40px)', letterSpacing: 3, color: 'var(--cream)' }}>
            CATEGORIAS DA BIBLIOTECA
          </h1>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)' }}>
          {categorias.length} categori{categorias.length !== 1 ? 'as' : 'a'}
        </p>
      </div>

      {/* Manager */}
      <div style={{ padding: 'clamp(24px,3vw,40px) var(--px)', maxWidth: 640 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32 }}>
          Gerencie as categorias usadas para classificar as obras da biblioteca. Estas categorias são independentes das categorias de conteúdo do site.
        </p>
        <BibliotecaCategoriasManager initialCategorias={categorias} />
      </div>
    </div>
  )
}
