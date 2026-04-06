import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BibliotecaAdminForm from '@/components/biblioteca/BibliotecaAdminForm'
import DeleteButton from './DeleteButton'
import type { Metadata } from 'next'

export const revalidate = 0
export const metadata: Metadata = { title: 'Admin · Editar Obra' }

async function getData(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/control/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!(profile as any)?.is_admin) redirect('/control')

  const { data: book } = await service
    .from('biblioteca')
    .select('id, title, author, year, category, era, description, is_published, order_index, cover_url')
    .eq('id', id)
    .single()

  if (!book) notFound()
  return { book }
}

export default async function EditarBibliotecaPage({ params }: { params: { id: string } }) {
  const { book } = await getData(params.id)

  return (
    <div>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--faint)',
        padding: 'clamp(24px,3vw,40px) var(--px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/control" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Admin</Link>
            {' › '}
            <Link href="/control/biblioteca" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Biblioteca</Link>
            {' › '}
            Editar
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,36px)', letterSpacing: 3, color: 'var(--cream)' }}>
            {(book as any).title}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 6 }}>
            {(book as any).author}
          </p>
        </div>

        <Link
          href="/control/biblioteca"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
            color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          ← Voltar
        </Link>
      </div>

      {/* Cover preview */}
      {(book as any).cover_url && (
        <div style={{ padding: 'clamp(20px,3vw,32px) var(--px)', borderBottom: '1px solid var(--faint)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={(book as any).cover_url}
            alt={(book as any).title}
            style={{ width: 64, height: 88, objectFit: 'cover', border: '1px solid var(--faint)' }}
          />
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Capa atual
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--faint)' }}>
              Para substituir, selecione uma nova imagem no formulário abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Edit form */}
      <div style={{ padding: 'clamp(24px,3vw,40px) var(--px)' }}>
        <BibliotecaAdminForm initial={book} />
      </div>

      {/* Danger zone */}
      <div style={{ padding: 'clamp(24px,3vw,40px) var(--px)', borderTop: '1px solid var(--faint)', marginTop: 40 }}>
        <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16 }}>
          Zona de Perigo
        </h3>
        <DeleteButton bookId={(book as any).id} bookTitle={(book as any).title} />
      </div>
    </div>
  )
}
